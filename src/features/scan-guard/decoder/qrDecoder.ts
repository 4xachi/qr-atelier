import * as ZXingNs from '@zxing/library';
import type { DecodeHintType } from '@zxing/library';

const ZXing =
  (ZXingNs as unknown as { default?: typeof ZXingNs }).default &&
  typeof (ZXingNs as unknown as { default?: typeof ZXingNs }).default?.RGBLuminanceSource ===
    'function'
    ? (ZXingNs as unknown as { default: typeof ZXingNs }).default
    : ZXingNs;

const {
  BinaryBitmap,
  DecodeHintType: DecodeHintEnum,
  HybridBinarizer,
  InvertedLuminanceSource,
  QRCodeReader,
  RGBLuminanceSource,
} = ZXing;

export interface RgbaImageBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface DecodeOutput {
  success: boolean;
  text: string | null;
  inverted: boolean;
  error?: string;
}

/**
 * Converts RGBA pixel data into 8-bit grayscale luminance values,
 * compositing semi-transparent pixels over a white (#FFFFFF) reference surface.
 */
export function rgbaToLuminance(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const total = width * height;
  const luminances = new Uint8ClampedArray(total);
  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const alpha = rgba[o + 3] / 255;
    const r = Math.round(rgba[o] * alpha + 255 * (1 - alpha));
    const g = Math.round(rgba[o + 1] * alpha + 255 * (1 - alpha));
    const b = Math.round(rgba[o + 2] * alpha + 255 * (1 - alpha));
    luminances[i] = ((r + 2 * g + b) >> 2) & 0xff;
  }
  return luminances;
}

/**
 * Independent QR decoder powered by @zxing/library.
 * Decodes raster RGBA pixels without reading application state.
 */
export function decodeQrFromRgba(buffer: RgbaImageBuffer): DecodeOutput {
  if (!buffer.data || buffer.width <= 0 || buffer.height <= 0) {
    return {
      success: false,
      text: null,
      inverted: false,
      error: 'Empty or invalid raster buffer.',
    };
  }

  const luminances = rgbaToLuminance(buffer.data, buffer.width, buffer.height);
  const source = new RGBLuminanceSource(luminances, buffer.width, buffer.height);
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintEnum.TRY_HARDER, true);

  const reader = new QRCodeReader();

  try {
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = reader.decode(bitmap, hints);
    return {
      success: true,
      text: result.getText(),
      inverted: false,
    };
  } catch {
    // Attempt inverted decode only to diagnose light-on-dark QR risk explicitly
    try {
      const invertedSource = new InvertedLuminanceSource(source);
      const invertedBitmap = new BinaryBitmap(new HybridBinarizer(invertedSource));
      const result = reader.decode(invertedBitmap, hints);
      return {
        success: true,
        text: result.getText(),
        inverted: true,
      };
    } catch (err) {
      return {
        success: false,
        text: null,
        inverted: false,
        error:
          err instanceof Error && err.message
            ? 'Independent ZXing decoder could not locate a readable QR matrix.'
            : 'QR decode failed.',
      };
    }
  }
}

export function decodeQrFromCanvas(canvas: HTMLCanvasElement): DecodeOutput {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      success: false,
      text: null,
      inverted: false,
      error: 'Canvas 2D context unavailable.',
    };
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return decodeQrFromRgba({
    data: imageData.data,
    width: imageData.width,
    height: imageData.height,
  });
}
