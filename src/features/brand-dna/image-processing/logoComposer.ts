import { extractDominantColorsFromRgba, buildBrandPaletteSuggestions, type BrandPaletteSuggestion } from '../palette/colorMath';
import { sanitizeSvgMarkup, validateLogoFileMeta } from './svgSanitizer';
import type { LogoConfig } from '../../qr-engine/types/designConfig';

export interface LoadedLogoAsset {
  fileName: string;
  mimeType: string;
  isSvg: boolean;
  wasSanitized: boolean;
  sanitizationNotes: string[];
  sourceDataUrl: string;
  width: number;
  height: number;
  dominantColors: string[];
  palettes: BrandPaletteSuggestion[];
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image file. It may be corrupted or unsupported.'));
    img.src = src;
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads, validates, sanitizes (if SVG), rasterizes, and extracts Brand DNA palettes
 * locally in the browser without any network upload.
 */
export async function processUploadedLogoFile(file: File): Promise<LoadedLogoAsset> {
  const metaCheck = validateLogoFileMeta(file.name, file.type, file.size);
  if (!metaCheck.valid) {
    throw new Error(metaCheck.error || 'Invalid logo file.');
  }

  let sourceDataUrl = '';
  let wasSanitized = false;
  const sanitizationNotes: string[] = [];

  if (metaCheck.isSvg) {
    const rawSvg = await readFileAsText(file);
    const sanitized = sanitizeSvgMarkup(rawSvg);
    if (!sanitized.safe) {
      throw new Error(sanitized.error || 'SVG file could not be sanitized safely.');
    }
    wasSanitized = true;
    if (sanitized.removedElements.length > 0) {
      sanitizationNotes.push(`Removed unsafe elements: ${sanitized.removedElements.join(', ')}`);
    }
    if (sanitized.removedAttributes.length > 0) {
      sanitizationNotes.push(`Stripped unsafe attributes: ${sanitized.removedAttributes.join(', ')}`);
    }
    if (sanitizationNotes.length === 0) {
      sanitizationNotes.push('SVG sanitized and rasterized locally.');
    }
    const svgBlob = new Blob([sanitized.sanitizedSvg], { type: 'image/svg+xml;charset=utf-8' });
    sourceDataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => reject(new Error('Failed to encode sanitized SVG.'));
      r.readAsDataURL(svgBlob);
    });
  } else {
    sourceDataUrl = await readFileAsDataUrl(file);
  }

  const img = await loadImageElement(sourceDataUrl);
  const maxDim = 512;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || 256) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 256) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser 2D canvas context unavailable.');
  }
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  // Rasterize SVG into a clean PNG data URL so untrusted XML never enters QR SVG output directly
  const safeRasterDataUrl = metaCheck.isSvg ? canvas.toDataURL('image/png') : sourceDataUrl;
  const dominantColors = extractDominantColorsFromRgba(imageData.data, 5);
  const palettes = buildBrandPaletteSuggestions(dominantColors);

  return {
    fileName: file.name,
    mimeType: file.type || (metaCheck.isSvg ? 'image/svg+xml' : 'image/png'),
    isSvg: metaCheck.isSvg,
    wasSanitized,
    sanitizationNotes,
    sourceDataUrl: safeRasterDataUrl,
    width: img.naturalWidth || w,
    height: img.naturalHeight || h,
    dominantColors,
    palettes,
  };
}

/**
 * Composites a logo image with backdrop, padding, shape clipping, fit, and border
 * onto a square 256x256 PNG data URL consumed by the QR Engine Adapter.
 */
export async function composeStyledLogoDataUrl(
  sourceDataUrl: string,
  logoConfig: LogoConfig
): Promise<string> {
  const img = await loadImageElement(sourceDataUrl);
  const boxSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = boxSize;
  canvas.height = boxSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceDataUrl;

  const border = logoConfig.shape === 'none' ? 0 : logoConfig.borderWidth * 2;
  const pad = logoConfig.paddingPx * 2;
  const radius =
    logoConfig.shape === 'circle'
      ? boxSize / 2
      : logoConfig.shape === 'rounded'
      ? 36
      : 0;

  const drawRoundedClip = (inset: number, r: number) => {
    const s = boxSize - inset * 2;
    ctx.beginPath();
    if (logoConfig.shape === 'circle') {
      ctx.arc(boxSize / 2, boxSize / 2, s / 2, 0, Math.PI * 2);
    } else if (r > 0) {
      ctx.roundRect(inset, inset, s, s, Math.max(0, r - inset * 0.5));
    } else {
      ctx.rect(inset, inset, s, s);
    }
    ctx.closePath();
  };

  // Draw backdrop if shape is enabled
  if (logoConfig.shape !== 'none') {
    ctx.save();
    drawRoundedClip(border / 2, radius);
    ctx.fillStyle = logoConfig.backdropColor;
    ctx.fill();
    if (border > 0) {
      ctx.lineWidth = border;
      ctx.strokeStyle = logoConfig.borderColor;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Clip inner logo region
  ctx.save();
  const innerInset = border + pad;
  const innerSize = Math.max(16, boxSize - innerInset * 2);
  if (logoConfig.shape !== 'none') {
    drawRoundedClip(innerInset, Math.max(0, radius - pad * 0.5));
    ctx.clip();
  }

  const iw = img.naturalWidth || boxSize;
  const ih = img.naturalHeight || boxSize;
  const ratio =
    logoConfig.fit === 'cover'
      ? Math.max(innerSize / iw, innerSize / ih)
      : Math.min(innerSize / iw, innerSize / ih);

  const dw = iw * ratio;
  const dh = ih * ratio;
  const dx = innerInset + (innerSize - dw) / 2;
  const dy = innerInset + (innerSize - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
