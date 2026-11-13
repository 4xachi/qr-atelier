import { z } from 'zod';

export const DESIGN_CONFIG_SCHEMA_VERSION = 1 as const;

export const SUPPORTED_DOT_TYPES = [
  'square',
  'dots',
  'rounded',
  'extra-rounded',
  'classy',
  'classy-rounded',
] as const;

export const SUPPORTED_CORNER_SQUARE_TYPES = [
  'square',
  'dot',
  'extra-rounded',
] as const;

export const SUPPORTED_CORNER_DOT_TYPES = ['square', 'dot'] as const;

export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const;

export const GRADIENT_TYPES = ['linear', 'radial'] as const;

export const LOGO_SHAPES = ['none', 'square', 'rounded', 'circle'] as const;
export const LOGO_FITS = ['contain', 'cover'] as const;
export const FRAME_STYLES = [
  'none',
  'card',
  'badge-bottom',
  'minimal-border',
  'scan-pill',
  'corner-brackets',
  'polaroid',
  'ticket',
] as const;
export const CAPTION_POSITIONS = ['bottom', 'top'] as const;
export const CAPTION_STYLES = ['clean', 'pill', 'uppercase'] as const;
export const CAPTION_FONTS = ['sans', 'serif', 'mono'] as const;

export type SupportedDotType = (typeof SUPPORTED_DOT_TYPES)[number];
export type SupportedCornerSquareType = (typeof SUPPORTED_CORNER_SQUARE_TYPES)[number];
export type SupportedCornerDotType = (typeof SUPPORTED_CORNER_DOT_TYPES)[number];
export type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number];
export type GradientType = (typeof GRADIENT_TYPES)[number];
export type LogoShape = (typeof LOGO_SHAPES)[number];
export type LogoFit = (typeof LOGO_FITS)[number];
export type FrameStyle = (typeof FRAME_STYLES)[number];
export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];
export type CaptionStyle = (typeof CAPTION_STYLES)[number];
export type CaptionFont = (typeof CAPTION_FONTS)[number];

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, 'Must be a valid #RGB or #RRGGBB hex color.');

export function normalizeHex(hex: string): string {
  const clean = hex.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const r = clean[1];
    const g = clean[2];
    const b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return clean.toUpperCase();
}

export const gradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: hexColorSchema,
});

export const gradientConfigSchema = z.object({
  type: z.enum(GRADIENT_TYPES),
  rotationDeg: z.number().min(0).max(360),
  stops: z.array(gradientStopSchema).min(2).max(3),
});

export const colorFillSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('solid'),
    color: hexColorSchema,
  }),
  z.object({
    mode: z.literal('gradient'),
    gradient: gradientConfigSchema,
  }),
]);

export const logoConfigSchema = z.object({
  enabled: z.boolean(),
  sizeRatio: z.number().min(0.08).max(0.32),
  fit: z.enum(LOGO_FITS),
  paddingPx: z.number().min(0).max(24),
  shape: z.enum(LOGO_SHAPES),
  backdropColor: hexColorSchema,
  borderWidth: z.number().min(0).max(8),
  borderColor: hexColorSchema,
});

export const frameConfigSchema = z.object({
  style: z.enum(FRAME_STYLES),
  borderWidth: z.number().min(0).max(16),
  borderColor: hexColorSchema,
  borderRadius: z.number().min(0).max(40),
  frameColor: hexColorSchema,
  accentColor: hexColorSchema.default('#0F766E'),
  shadowEnabled: z.boolean().default(false),
  caption: z.string().max(48),
  captionPosition: z.enum(CAPTION_POSITIONS),
  captionColor: hexColorSchema,
  captionStyle: z.enum(CAPTION_STYLES).default('clean'),
  captionFont: z.enum(CAPTION_FONTS).default('sans'),
});

export const designConfigSchema = z.object({
  schemaVersion: z.literal(DESIGN_CONFIG_SCHEMA_VERSION),
  errorCorrectionLevel: z.enum(ERROR_CORRECTION_LEVELS),
  quietZonePx: z.number().min(0).max(48),
  dots: z.object({
    type: z.enum(SUPPORTED_DOT_TYPES),
    fill: colorFillSchema,
  }),
  cornersSquare: z.object({
    type: z.enum(SUPPORTED_CORNER_SQUARE_TYPES),
    useCustomColor: z.boolean(),
    color: hexColorSchema,
  }),
  cornersDot: z.object({
    type: z.enum(SUPPORTED_CORNER_DOT_TYPES),
    useCustomColor: z.boolean(),
    color: hexColorSchema,
  }),
  background: z.object({
    transparent: z.boolean(),
    color: hexColorSchema,
    cornerRadius: z.number().min(0).max(24),
  }),
  logo: logoConfigSchema,
  frame: frameConfigSchema,
});

export type ColorFill = z.infer<typeof colorFillSchema>;
export type GradientConfig = z.infer<typeof gradientConfigSchema>;
export type LogoConfig = z.infer<typeof logoConfigSchema>;
export type FrameConfig = z.infer<typeof frameConfigSchema>;
export type DesignConfig = z.infer<typeof designConfigSchema>;

export const MAX_RECOMMENDED_LOGO_RATIO = 0.22;
export const SAFE_AREA_HARD_LIMIT_RATIO = 0.26;

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  schemaVersion: DESIGN_CONFIG_SCHEMA_VERSION,
  errorCorrectionLevel: 'M',
  quietZonePx: 20,
  dots: {
    type: 'rounded',
    fill: {
      mode: 'solid',
      color: '#0F172A',
    },
  },
  cornersSquare: {
    type: 'extra-rounded',
    useCustomColor: true,
    color: '#0F766E',
  },
  cornersDot: {
    type: 'dot',
    useCustomColor: true,
    color: '#0F172A',
  },
  background: {
    transparent: false,
    color: '#FFFFFF',
    cornerRadius: 8,
  },
  logo: {
    enabled: true,
    sizeRatio: 0.18,
    fit: 'contain',
    paddingPx: 6,
    shape: 'rounded',
    backdropColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  frame: {
    style: 'card',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    frameColor: '#FFFFFF',
    accentColor: '#0F766E',
    shadowEnabled: false,
    caption: '',
    captionPosition: 'bottom',
    captionColor: '#0F172A',
    captionStyle: 'clean',
    captionFont: 'sans',
  },
};

export function cloneDesignConfig(config: DesignConfig): DesignConfig {
  return JSON.parse(JSON.stringify(config)) as DesignConfig;
}

export function serializeDesignConfig(config: DesignConfig): string {
  const validated = designConfigSchema.parse(config);
  return JSON.stringify(validated);
}

export function migrateAndParseDesignConfig(raw: unknown): DesignConfig {
  if (typeof raw === 'string') {
    raw = JSON.parse(raw);
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid design configuration payload.');
  }
  const obj = raw as Record<string, unknown>;
  const rawFrame =
    obj.frame && typeof obj.frame === 'object' ? (obj.frame as Record<string, unknown>) : undefined;
  // Handle unversioned or v0 legacy objects cleanly by merging onto defaults
  if (obj.schemaVersion === undefined || obj.schemaVersion === 0) {
    const candidate = {
      ...DEFAULT_DESIGN_CONFIG,
      ...obj,
      frame: {
        ...DEFAULT_DESIGN_CONFIG.frame,
        ...(rawFrame ?? {}),
      },
      schemaVersion: DESIGN_CONFIG_SCHEMA_VERSION,
    };
    return designConfigSchema.parse(candidate);
  }
  return designConfigSchema.parse(obj);
}
