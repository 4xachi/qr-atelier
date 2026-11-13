import QRCodeStyling, {
  type DrawType,
  type Gradient,
  type Options as QrStylingOptions,
} from 'qr-code-styling';
import type { ColorFill, DesignConfig, ErrorCorrectionLevel } from '../types/designConfig';

export const ECC_AREA_RATIOS: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

function toQrGradient(fill: ColorFill): { color?: string; gradient?: Gradient } {
  if (fill.mode === 'solid') {
    return { color: fill.color };
  }
  return {
    gradient: {
      type: fill.gradient.type,
      rotation: (fill.gradient.rotationDeg * Math.PI) / 180,
      colorStops: fill.gradient.stops.map((s) => ({
        offset: s.offset,
        color: s.color,
      })),
    },
  };
}

/**
 * Pure, testable mapping from typed DesignConfig + validated payload to qr-code-styling Options.
 */
export function mapConfigToQrStylingOptions(
  payload: string,
  config: DesignConfig,
  qrSizePx: number,
  logoDataUrl?: string | null,
  drawType: DrawType = 'svg'
): QrStylingOptions {
  const dotsFill = toQrGradient(config.dots.fill);
  const fallbackColor =
    config.dots.fill.mode === 'solid'
      ? config.dots.fill.color
      : config.dots.fill.gradient.stops[0]?.color || '#0F172A';

  const scaledQuietZone = Math.round((config.quietZonePx * qrSizePx) / 360);

  const eccPercent = ECC_AREA_RATIOS[config.errorCorrectionLevel];
  const logoAreaRatio = config.logo.sizeRatio * config.logo.sizeRatio;
  const computedImageSize = Math.min(0.95, Number((logoAreaRatio / eccPercent).toFixed(3)));

  const hasLogo = Boolean(config.logo.enabled && logoDataUrl);

  return {
    type: drawType,
    width: qrSizePx,
    height: qrSizePx,
    margin: scaledQuietZone,
    data: payload,
    image: hasLogo ? logoDataUrl! : undefined,
    qrOptions: {
      errorCorrectionLevel: config.errorCorrectionLevel,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: computedImageSize,
      margin: 2,
      saveAsBlob: true,
    },
    dotsOptions: {
      type: config.dots.type,
      ...dotsFill,
    },
    cornersSquareOptions: {
      type: config.cornersSquare.type,
      ...(config.cornersSquare.useCustomColor
        ? { color: config.cornersSquare.color }
        : dotsFill.gradient
        ? { gradient: dotsFill.gradient }
        : { color: fallbackColor }),
    },
    cornersDotOptions: {
      type: config.cornersDot.type,
      ...(config.cornersDot.useCustomColor
        ? { color: config.cornersDot.color }
        : dotsFill.gradient
        ? { gradient: dotsFill.gradient }
        : { color: fallbackColor }),
    },
    backgroundOptions: {
      color: config.background.transparent ? 'transparent' : config.background.color,
      round: config.background.cornerRadius > 0 ? config.background.cornerRadius / 100 : 0,
    },
  };
}

export interface FrameLayoutMetrics {
  totalWidth: number;
  totalHeight: number;
  qrSize: number;
  qrX: number;
  qrY: number;
  padding: number;
  outerInset: number;
  captionAreaHeight: number;
  captionY: number;
  fontSize: number;
}

export function computeFrameLayout(
  config: DesignConfig,
  exportWidthPx: number
): FrameLayoutMetrics {
  const scale = exportWidthPx / 360;
  const hasFrame = config.frame.style !== 'none';
  const hasCaption = config.frame.caption.trim().length > 0;
  const outerInset = hasFrame && config.frame.shadowEnabled ? Math.round(10 * scale) : 0;

  const padding = hasFrame ? Math.round(20 * scale) : 0;
  const fontSize = Math.round(
    (config.frame.captionStyle === 'uppercase' ? 13 : 15) * scale
  );

  let baseCaptionHeight = 38;
  if (config.frame.style === 'polaroid') {
    baseCaptionHeight = 48;
  } else if (
    config.frame.style === 'scan-pill' ||
    config.frame.style === 'ticket' ||
    config.frame.captionStyle === 'pill'
  ) {
    baseCaptionHeight = 46;
  }

  const captionAreaHeight = hasCaption ? Math.round(baseCaptionHeight * scale) : 0;

  const qrSize = Math.max(64, exportWidthPx - (padding + outerInset) * 2);
  const totalWidth = exportWidthPx;
  const totalHeight = qrSize + (padding + outerInset) * 2 + captionAreaHeight;

  const captionAtTop = hasCaption && config.frame.captionPosition === 'top';
  const qrX = outerInset + padding;
  const qrY = outerInset + padding + (captionAtTop ? captionAreaHeight : 0);
  const captionY = captionAtTop
    ? outerInset + padding + Math.round(captionAreaHeight * 0.56)
    : outerInset + padding + qrSize + Math.round(captionAreaHeight * 0.62);

  return {
    totalWidth,
    totalHeight,
    qrSize,
    qrX,
    qrY,
    padding,
    outerInset,
    captionAreaHeight,
    captionY,
    fontSize,
  };
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveCaptionFontFamily(font: DesignConfig['frame']['captionFont']): string {
  switch (font) {
    case 'serif':
      return "'Georgia', 'Times New Roman', serif";
    case 'mono':
      return "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
    case 'sans':
    default:
      return "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  }
}

/**
 * Generates the raw core SVG markup from qr-code-styling.
 */
async function generateCoreQrSvgString(
  payload: string,
  config: DesignConfig,
  qrSizePx: number,
  logoDataUrl?: string | null
): Promise<string> {
  const options = mapConfigToQrStylingOptions(payload, config, qrSizePx, logoDataUrl, 'svg');
  const instance = new QRCodeStyling(options);
  const raw = await instance.getRawData('svg');
  if (!raw) {
    throw new Error('QR renderer returned empty SVG output.');
  }
  if (raw instanceof Blob) {
    return await raw.text();
  }
  return raw.toString('utf-8');
}

/**
 * Composes the complete SVG asset (frame, border, background, QR matrix, logo, caption).
 * Identical visual source for both SVG download and raster verification.
 */
export async function composeExportSvg(
  payload: string,
  config: DesignConfig,
  exportWidthPx: number,
  logoDataUrl?: string | null
): Promise<string> {
  const layout = computeFrameLayout(config, exportWidthPx);
  const coreSvg = await generateCoreQrSvgString(payload, config, layout.qrSize, logoDataUrl);

  // Extract inner <defs> and body from coreSvg so it embeds cleanly inside our outer SVG
  const innerSvgMatch = coreSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const innerContent = innerSvgMatch ? innerSvgMatch[1] : coreSvg;

  const scale = exportWidthPx / 360;
  const hasFrame = config.frame.style !== 'none';
  const borderWidth = hasFrame ? Math.round(config.frame.borderWidth * scale) : 0;
  const borderRadius = hasFrame ? Math.round(config.frame.borderRadius * scale) : 0;
  const halfStroke = borderWidth / 2;

  const cardX = layout.outerInset + halfStroke;
  const cardY = layout.outerInset + halfStroke;
  const cardW = layout.totalWidth - layout.outerInset * 2 - borderWidth;
  const cardH = layout.totalHeight - layout.outerInset * 2 - borderWidth;

  const frameBgFill =
    config.background.transparent && !hasFrame
      ? 'none'
      : hasFrame
      ? config.frame.frameColor
      : config.background.color;

  const captionText = config.frame.caption.trim();
  const captionAtTop = config.frame.captionPosition === 'top';
  const accentColor = config.frame.accentColor || '#0F766E';
  const isBadgeBottom =
    config.frame.style === 'badge-bottom' && captionText.length > 0;
  const isScanPill =
    (config.frame.style === 'scan-pill' || config.frame.captionStyle === 'pill') &&
    captionText.length > 0;
  const isTicket = config.frame.style === 'ticket';
  const isCornerBrackets = config.frame.style === 'corner-brackets';
  const isPolaroid = config.frame.style === 'polaroid';

  const ticketSplitY = captionAtTop
    ? layout.outerInset + layout.padding + layout.captionAreaHeight - Math.round(6 * scale)
    : layout.outerInset + layout.padding + layout.qrSize + Math.round(10 * scale);
  const notchR = Math.round(9 * scale);

  const defsParts: string[] = [];
  if (hasFrame && config.frame.shadowEnabled) {
    defsParts.push(
      `<filter id="qr-card-shadow" x="-15%" y="-15%" width="130%" height="135%">` +
        `<feDropShadow dx="0" dy="${Math.round(4 * scale)}" stdDeviation="${Math.round(5 * scale)}" flood-color="#0F172A" flood-opacity="0.12" />` +
        `</filter>`
    );
  }
  if (isTicket) {
    const leftEdge = layout.outerInset;
    const rightEdge = layout.totalWidth - layout.outerInset;
    defsParts.push(
      `<mask id="qr-ticket-mask">` +
        `<rect x="0" y="0" width="${layout.totalWidth}" height="${layout.totalHeight}" fill="#FFFFFF" />` +
        `<circle cx="${leftEdge}" cy="${ticketSplitY}" r="${notchR}" fill="#000000" />` +
        `<circle cx="${rightEdge}" cy="${ticketSplitY}" r="${notchR}" fill="#000000" />` +
        `</mask>`
    );
  }

  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${layout.totalWidth}" height="${layout.totalHeight}" viewBox="0 0 ${layout.totalWidth} ${layout.totalHeight}">`,
  ];

  if (defsParts.length > 0) {
    parts.push(`<defs>${defsParts.join('')}</defs>`);
  }

  const cardAttrs: string[] = [];
  if (hasFrame && config.frame.shadowEnabled) {
    cardAttrs.push(`filter="url(#qr-card-shadow)"`);
  }
  if (isTicket) {
    cardAttrs.push(`mask="url(#qr-ticket-mask)"`);
  }

  if (frameBgFill !== 'none' || borderWidth > 0) {
    parts.push(
      `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="${borderRadius}" ry="${borderRadius}" fill="${frameBgFill}"${
        borderWidth > 0
          ? ` stroke="${config.frame.borderColor}" stroke-width="${borderWidth}"`
          : ''
      }${cardAttrs.length > 0 ? ` ${cardAttrs.join(' ')}` : ''} />`
    );
  }

  // Polaroid subtle inner window rule around the QR square
  if (isPolaroid) {
    const rulePad = Math.round(4 * scale);
    parts.push(
      `<rect x="${layout.qrX - rulePad}" y="${layout.qrY - rulePad}" width="${
        layout.qrSize + rulePad * 2
      }" height="${layout.qrSize + rulePad * 2}" rx="${Math.round(
        6 * scale
      )}" fill="none" stroke="${config.frame.borderColor}" stroke-width="${Math.max(
        1,
        Math.round(1 * scale)
      )}" stroke-opacity="0.65" />`
    );
  }

  // Ticket stub dashed divider + notch rim arcs
  if (isTicket) {
    const lineInset = layout.outerInset + notchR + Math.round(6 * scale);
    parts.push(
      `<line x1="${lineInset}" y1="${ticketSplitY}" x2="${
        layout.totalWidth - lineInset
      }" y2="${ticketSplitY}" stroke="${config.frame.borderColor}" stroke-width="${Math.max(
        1,
        Math.round(1.5 * scale)
      )}" stroke-dasharray="${Math.round(5 * scale)} ${Math.round(4 * scale)}" />`
    );
    if (borderWidth > 0) {
      const leftRimX = layout.outerInset + halfStroke;
      const rightRimX = layout.totalWidth - layout.outerInset - halfStroke;
      parts.push(
        `<path d="M ${leftRimX} ${ticketSplitY - notchR} A ${notchR} ${notchR} 0 0 1 ${leftRimX} ${
          ticketSplitY + notchR
        } M ${rightRimX} ${ticketSplitY - notchR} A ${notchR} ${notchR} 0 0 0 ${rightRimX} ${
          ticketSplitY + notchR
        }" fill="none" stroke="${config.frame.borderColor}" stroke-width="${borderWidth}" />`
      );
    }
  }

  // Badge-bottom / badge-top soft tint band
  if (isBadgeBottom && !isScanPill) {
    const bandY = captionAtTop
      ? layout.outerInset + Math.round(10 * scale)
      : layout.outerInset + layout.padding + layout.qrSize + Math.round(6 * scale);
    const bandH = layout.captionAreaHeight - Math.round(6 * scale);
    const pillPad = layout.outerInset + Math.round(14 * scale);
    parts.push(
      `<rect x="${pillPad}" y="${bandY}" width="${
        layout.totalWidth - pillPad * 2
      }" height="${bandH}" rx="${Math.round(8 * scale)}" fill="${accentColor}" fill-opacity="0.14" />`
    );
  }

  // Scan-pill high-contrast CTA pill behind caption
  if (isScanPill) {
    const displayText =
      config.frame.captionStyle === 'uppercase'
        ? captionText.toUpperCase()
        : captionText;
    const pillH = Math.round(30 * scale);
    const charW = config.frame.captionStyle === 'uppercase' ? 0.68 : 0.6;
    const maxPillW = cardW - Math.round(28 * scale);
    const pillW = Math.max(
      Math.round(116 * scale),
      Math.min(maxPillW, Math.round(displayText.length * layout.fontSize * charW + 38 * scale))
    );
    const pillX = Math.round((layout.totalWidth - pillW) / 2);
    const pillY = Math.round(layout.captionY - pillH / 2);
    parts.push(
      `<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${Math.round(
        pillH / 2
      )}" fill="${accentColor}" />`
    );
  }

  parts.push(`<g transform="translate(${layout.qrX}, ${layout.qrY})">${innerContent}</g>`);

  // Architectural viewfinder corner brackets
  if (isCornerBrackets) {
    const bStroke = Math.max(2, Math.round(3.5 * scale));
    const bPad = layout.outerInset + Math.round(8 * scale);
    const bLen = Math.round(24 * scale);
    const r = Math.min(Math.round(8 * scale), borderRadius);
    const x1 = bPad;
    const y1 = bPad;
    const x2 = layout.totalWidth - bPad;
    const y2 = layout.totalHeight - bPad;
    const bracketPath = [
      // Top-left
      `M ${x1} ${y1 + bLen} L ${x1} ${y1 + r} Q ${x1} ${y1} ${x1 + r} ${y1} L ${x1 + bLen} ${y1}`,
      // Top-right
      `M ${x2 - bLen} ${y1} L ${x2 - r} ${y1} Q ${x2} ${y1} ${x2} ${y1 + r} L ${x2} ${y1 + bLen}`,
      // Bottom-left
      `M ${x1} ${y2 - bLen} L ${x1} ${y2 - r} Q ${x1} ${y2} ${x1 + r} ${y2} L ${x1 + bLen} ${y2}`,
      // Bottom-right
      `M ${x2 - bLen} ${y2} L ${x2 - r} ${y2} Q ${x2} ${y2} ${x2} ${y2 - r} L ${x2} ${y2 - bLen}`,
    ].join(' ');
    parts.push(
      `<path d="${bracketPath}" fill="none" stroke="${accentColor}" stroke-width="${bStroke}" stroke-linecap="round" stroke-linejoin="round" />`
    );
  }

  if (captionText) {
    const isUpper = config.frame.captionStyle === 'uppercase';
    const renderedCaption = isUpper ? captionText.toUpperCase() : captionText;
    const fontFamily = resolveCaptionFontFamily(config.frame.captionFont);
    const letterSpacing = isUpper ? ` letter-spacing="${(1.4 * scale).toFixed(1)}"` : '';
    const fontWeight = isUpper || isScanPill ? '700' : '600';

    parts.push(
      `<text x="${layout.totalWidth / 2}" y="${layout.captionY}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${layout.fontSize}" font-weight="${fontWeight}"${letterSpacing} fill="${config.frame.captionColor}">${escapeXmlText(
        renderedCaption
      )}</text>`
    );
  }

  parts.push(`</svg>`);
  return parts.join('\n');
}

/**
 * Rasterizes the final composed SVG onto an HTMLCanvasElement at exact pixel dimensions.
 * Used for both PNG export and Scan Guard independent verification.
 */
export async function composeExportCanvas(
  payload: string,
  config: DesignConfig,
  exportWidthPx: number,
  logoDataUrl?: string | null
): Promise<{ canvas: HTMLCanvasElement; svgString: string }> {
  const svgString = await composeExportSvg(payload, config, exportWidthPx, logoDataUrl);
  const layout = computeFrameLayout(config, exportWidthPx);

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to rasterize composed QR SVG.'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = layout.totalWidth;
    canvas.height = layout.totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context for rasterization.');
    }
    ctx.drawImage(img, 0, 0, layout.totalWidth, layout.totalHeight);
    return { canvas, svgString };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type RasterExportFormat = 'png' | 'jpeg' | 'webp';

export async function canvasToRasterBlob(
  canvas: HTMLCanvasElement,
  format: RasterExportFormat,
  quality = 0.94
): Promise<Blob> {
  let targetCanvas = canvas;

  // JPEG does not support alpha transparency; composite over solid white to avoid black matte
  if (format === 'jpeg') {
    const matte = document.createElement('canvas');
    matte.width = canvas.width;
    matte.height = canvas.height;
    const mCtx = matte.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillRect(0, 0, matte.width, matte.height);
      mCtx.drawImage(canvas, 0, 0);
      targetCanvas = matte;
    }
  }

  const mimeType =
    format === 'jpeg'
      ? 'image/jpeg'
      : format === 'webp'
      ? 'image/webp'
      : 'image/png';

  return new Promise((resolve, reject) => {
    targetCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode ${format.toUpperCase()} image blob.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      format === 'png' ? undefined : quality
    );
  });
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return canvasToRasterBlob(canvas, 'png');
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
