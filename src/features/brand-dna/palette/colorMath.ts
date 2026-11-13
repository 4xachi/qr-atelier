import { normalizeHex } from '../../qr-engine/types/designConfig';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface BrandPaletteSuggestion {
  id: 'brand-dominant' | 'complementary' | 'monochrome' | 'high-contrast';
  label: string;
  description: string;
  dotsColor: string;
  dotsSecondaryColor?: string;
  cornersSquareColor: string;
  cornersDotColor: string;
  backgroundColor: string;
  contrastRatio: number;
}

export function hexToRgb(hex: string): RgbColor {
  const norm = normalizeHex(hex).slice(1);
  return {
    r: parseInt(norm.slice(0, 2), 16),
    g: parseInt(norm.slice(2, 4), 16),
    b: parseInt(norm.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function relativeLuminance({ r, g, b }: RgbColor): number {
  const toLinear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatioHex(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(hexToRgb(fgHex));
  const l2 = relativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function rgbToHsl({ r, g, b }: RgbColor): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const hn = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Darkens a brand color until it reaches at least `targetRatio` contrast against `bgHex`.
 */
export function ensureDarkContrast(fgHex: string, bgHex = '#FFFFFF', targetRatio = 5.5): string {
  if (contrastRatioHex(fgHex, bgHex) >= targetRatio) {
    return normalizeHex(fgHex);
  }
  const { h, s, l } = rgbToHsl(hexToRgb(fgHex));
  let currentL = Math.min(l, 0.45);
  while (currentL > 0.04) {
    const candidate = rgbToHex(hslToRgb(h, Math.min(1, s * 1.05), currentL));
    if (contrastRatioHex(candidate, bgHex) >= targetRatio) {
      return candidate;
    }
    currentL -= 0.04;
  }
  return '#0F172A';
}

/**
 * Extracts up to `maxColors` dominant brand colors from raw RGBA pixel data,
 * ignoring transparent pixels and filtering near-white/near-black noise unless needed.
 */
export function extractDominantColorsFromRgba(
  rgba: Uint8ClampedArray,
  maxColors = 5
): string[] {
  if (!rgba || rgba.length < 4) {
    return ['#0F172A', '#0F766E'];
  }

  // Quantize into 24-step buckets (11x11x11 color space) for fast, deterministic clustering
  const buckets = new Map<string, { count: number; rSum: number; gSum: number; bSum: number; satSum: number }>();
  const totalPixels = Math.floor(rgba.length / 4);
  const stride = Math.max(1, Math.floor(totalPixels / 12000));

  for (let i = 0; i < totalPixels; i += stride) {
    const idx = i * 4;
    const a = rgba[idx + 3];
    if (a < 110) continue; // Ignore transparent background pixels

    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];

    // Skip near-pure white canvas pixels when counting brand pigments
    if (r > 246 && g > 246 && b > 246) continue;

    const qr = Math.floor(r / 24);
    const qg = Math.floor(g / 24);
    const qb = Math.floor(b / 24);
    const key = `${qr},${qg},${qb}`;

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

    const entry = buckets.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0, satSum: 0 };
    entry.count += 1;
    entry.rSum += r;
    entry.gSum += g;
    entry.bSum += b;
    entry.satSum += sat;
    buckets.set(key, entry);
  }

  if (buckets.size === 0) {
    return ['#0F172A', '#0F766E'];
  }

  const ranked = Array.from(buckets.values())
    .map((b) => {
      const avgRgb: RgbColor = {
        r: b.rSum / b.count,
        g: b.gSum / b.count,
        b: b.bSum / b.count,
      };
      const avgSat = b.satSum / b.count;
      // Score favors both frequency and chromatic character
      const score = b.count * (1 + avgSat * 1.35);
      return { rgb: avgRgb, hex: rgbToHex(avgRgb), score };
    })
    .sort((a, b) => b.score - a.score);

  const distinct: { rgb: RgbColor; hex: string }[] = [];
  for (const item of ranked) {
    if (distinct.every((d) => colorDistance(d.rgb, item.rgb) > 42)) {
      distinct.push({ rgb: item.rgb, hex: item.hex });
      if (distinct.length >= maxColors) break;
    }
  }

  return distinct.map((d) => d.hex);
}

/**
 * Generates 4 scannable, brand-aware palette suggestions from extracted colors.
 * All returned colors are plain editable hex values.
 */
export function buildBrandPaletteSuggestions(
  extractedColors: string[]
): BrandPaletteSuggestion[] {
  const primaryRaw = extractedColors[0] || '#0F766E';
  const secondaryRaw = extractedColors[1] || primaryRaw;

  const primaryInk = ensureDarkContrast(primaryRaw, '#FFFFFF', 5.2);
  const secondaryInk = ensureDarkContrast(secondaryRaw, '#FFFFFF', 4.6);

  const primaryHsl = rgbToHsl(hexToRgb(primaryRaw));
  const compRgb = hslToRgb((primaryHsl.h + 180) % 360, Math.max(0.45, primaryHsl.s), 0.34);
  const compInk = ensureDarkContrast(rgbToHex(compRgb), '#FFFFFF', 4.8);

  const monoDark = ensureDarkContrast(
    rgbToHex(hslToRgb(primaryHsl.h, Math.min(0.28, primaryHsl.s), 0.16)),
    '#FFFFFF',
    10.0
  );
  const monoBg = rgbToHex(hslToRgb(primaryHsl.h, 0.12, 0.97));
  const monoEye = ensureDarkContrast(
    rgbToHex(hslToRgb(primaryHsl.h, Math.min(0.35, primaryHsl.s), 0.28)),
    monoBg,
    6.0
  );

  const highContrastAccent = ensureDarkContrast(primaryRaw, '#FFFFFF', 7.5);

  return [
    {
      id: 'brand-dominant',
      label: 'Brand Dominant',
      description: 'Tuned directly to your primary logo pigments with safe contrast.',
      dotsColor: primaryInk,
      dotsSecondaryColor: secondaryInk !== primaryInk ? secondaryInk : undefined,
      cornersSquareColor: secondaryInk,
      cornersDotColor: primaryInk,
      backgroundColor: '#FFFFFF',
      contrastRatio: contrastRatioHex(primaryInk, '#FFFFFF'),
    },
    {
      id: 'complementary',
      label: 'Complementary',
      description: 'Pairs your brand hue with its opposite color-wheel accent on finder eyes.',
      dotsColor: primaryInk,
      cornersSquareColor: compInk,
      cornersDotColor: compInk,
      backgroundColor: '#FFFFFF',
      contrastRatio: contrastRatioHex(primaryInk, '#FFFFFF'),
    },
    {
      id: 'monochrome',
      label: 'Monochrome Tonal',
      description: 'Unified tonal ink derived from your brand hue on a subtle tinted mat.',
      dotsColor: monoDark,
      cornersSquareColor: monoEye,
      cornersDotColor: monoDark,
      backgroundColor: monoBg,
      contrastRatio: contrastRatioHex(monoDark, monoBg),
    },
    {
      id: 'high-contrast',
      label: 'High Contrast',
      description: 'Deep charcoal modules with high-contrast brand eyes for tough lighting.',
      dotsColor: '#0F172A',
      cornersSquareColor: highContrastAccent,
      cornersDotColor: '#0F172A',
      backgroundColor: '#FFFFFF',
      contrastRatio: contrastRatioHex('#0F172A', '#FFFFFF'),
    },
  ];
}
