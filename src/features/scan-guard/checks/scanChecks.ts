import { contrastRatioHex, hexToRgb, relativeLuminance } from '../../brand-dna/palette/colorMath';
import { ECC_AREA_RATIOS } from '../../qr-engine/adapter/qrEngineAdapter';
import {
  cloneDesignConfig,
  type DesignConfig,
  MAX_RECOMMENDED_LOGO_RATIO,
} from '../../qr-engine/types/designConfig';

export type ScanWarningCode =
  | 'DECODE_FAILED'
  | 'PAYLOAD_MISMATCH'
  | 'INVERTED_COLORS'
  | 'LOW_CONTRAST'
  | 'MISSING_QUIET_ZONE'
  | 'EXCESSIVE_LOGO_COVERAGE'
  | 'LOW_RESOLUTION'
  | 'DENSE_PAYLOAD'
  | 'TRANSPARENT_BACKGROUND';

export type WarningSeverity = 'critical' | 'warning' | 'info';

export interface ScanWarning {
  code: ScanWarningCode;
  severity: WarningSeverity;
  title: string;
  detail: string;
  autoFixLabel?: string;
}

export interface ScanMetrics {
  minContrastRatio: number;
  quietZonePx: number;
  logoWidthRatio: number;
  logoAreaRatio: number;
  estimatedModules: number;
  moduleSizePx: number;
  payloadBytes: number;
}

export interface RiskEvaluationInput {
  expectedPayload: string;
  config: DesignConfig;
  hasLogoAsset: boolean;
  exportSizePx: number;
  decodeSuccess: boolean;
  decodedText: string | null;
  decodedInverted: boolean;
}

export function estimateQrModuleCount(payloadBytes: number, ecc: DesignConfig['errorCorrectionLevel']): number {
  // Approximate QR code version from byte capacity for Byte mode
  const factor = ecc === 'L' ? 1 : ecc === 'M' ? 0.8 : ecc === 'Q' ? 0.6 : 0.45;
  const effectiveBytes = Math.max(1, Math.ceil(payloadBytes / factor));
  if (effectiveBytes <= 17) return 21;
  if (effectiveBytes <= 32) return 25;
  if (effectiveBytes <= 53) return 29;
  if (effectiveBytes <= 78) return 33;
  if (effectiveBytes <= 106) return 37;
  if (effectiveBytes <= 154) return 41;
  if (effectiveBytes <= 230) return 49;
  if (effectiveBytes <= 367) return 57;
  if (effectiveBytes <= 532) return 69;
  return 85;
}

export function computeMinimumDesignContrast(config: DesignConfig): {
  minContrast: number;
  hasInvertedComponent: boolean;
} {
  const refBg = config.background.transparent ? '#FFFFFF' : config.background.color;
  const bgLum = relativeLuminance(hexToRgb(refBg));

  const fgColors: string[] = [];
  if (config.dots.fill.mode === 'solid') {
    fgColors.push(config.dots.fill.color);
  } else {
    for (const stop of config.dots.fill.gradient.stops) {
      fgColors.push(stop.color);
    }
  }
  if (config.cornersSquare.useCustomColor) {
    fgColors.push(config.cornersSquare.color);
  }
  if (config.cornersDot.useCustomColor) {
    fgColors.push(config.cornersDot.color);
  }

  let minContrast = Infinity;
  let hasInvertedComponent = false;

  for (const hex of fgColors) {
    const ratio = contrastRatioHex(hex, refBg);
    if (ratio < minContrast) minContrast = ratio;
    const fgLum = relativeLuminance(hexToRgb(hex));
    if (fgLum > bgLum + 0.05) {
      hasInvertedComponent = true;
    }
  }

  return {
    minContrast: Number.isFinite(minContrast) ? minContrast : 1,
    hasInvertedComponent,
  };
}

export function evaluateScanRisks(input: RiskEvaluationInput): {
  warnings: ScanWarning[];
  metrics: ScanMetrics;
} {
  const {
    expectedPayload,
    config,
    hasLogoAsset,
    exportSizePx,
    decodeSuccess,
    decodedText,
    decodedInverted,
  } = input;

  const warnings: ScanWarning[] = [];
  const payloadBytes = new TextEncoder().encode(expectedPayload).length;
  const estimatedModules = estimateQrModuleCount(payloadBytes, config.errorCorrectionLevel);
  const moduleSizePx = Number(((exportSizePx - config.quietZonePx * 2) / estimatedModules).toFixed(2));
  const { minContrast, hasInvertedComponent } = computeMinimumDesignContrast(config);

  const logoActive = hasLogoAsset && config.logo.enabled;
  const logoWidthRatio = logoActive ? config.logo.sizeRatio : 0;
  const logoAreaRatio = logoActive ? Number((logoWidthRatio * logoWidthRatio).toFixed(4)) : 0;

  // 1. Independent Decode Verification
  if (!decodeSuccess) {
    warnings.push({
      code: 'DECODE_FAILED',
      severity: 'critical',
      title: 'Software decoder could not read this QR code',
      detail:
        'ZXing failed to decode the rendered output. Restore high contrast, add a quiet zone, or shrink the center logo.',
      autoFixLabel: 'Restore Safe Scan Defaults',
    });
  } else if (decodedText !== expectedPayload) {
    warnings.push({
      code: 'PAYLOAD_MISMATCH',
      severity: 'critical',
      title: 'Decoded text does not match your payload',
      detail: 'The rendered QR decoded to unexpected data. Reset styling or check input characters.',
      autoFixLabel: 'Restore Safe Scan Defaults',
    });
  }

  // 2. Inverted Colors Check
  if (decodedInverted || hasInvertedComponent) {
    warnings.push({
      code: 'INVERTED_COLORS',
      severity: 'warning',
      title: 'Light modules on a dark background',
      detail:
        'Many built-in phone cameras and older retail scanners fail to read inverted (light-on-dark) QR codes.',
      autoFixLabel: 'Switch to Dark-on-Light',
    });
  }

  // 3. Contrast Ratio Check
  if (minContrast < 3.0) {
    warnings.push({
      code: 'LOW_CONTRAST',
      severity: 'critical',
      title: `Very low contrast (${minContrast.toFixed(1)}:1)`,
      detail:
        'Foreground modules and background are too close in luminance. Aim for at least 4.5:1 for dependable scanning.',
      autoFixLabel: 'Boost Contrast',
    });
  } else if (minContrast < 4.5) {
    warnings.push({
      code: 'LOW_CONTRAST',
      severity: 'warning',
      title: `Borderline contrast (${minContrast.toFixed(1)}:1)`,
      detail:
        'Moderate contrast may struggle under warm restaurant lighting or matte paper. Recommended minimum is 4.5:1.',
      autoFixLabel: 'Boost Contrast',
    });
  }

  // 4. Quiet Zone Check
  if (config.quietZonePx < 14) {
    warnings.push({
      code: 'MISSING_QUIET_ZONE',
      severity: config.quietZonePx < 8 ? 'critical' : 'warning',
      title: `Quiet zone is too narrow (${config.quietZonePx}px)`,
      detail:
        'QR scanners require a clear margin around the finder patterns to separate the code from surrounding artwork.',
      autoFixLabel: 'Set 20px Quiet Zone',
    });
  }

  // 5. Logo Safe-Area Check (never imply ECC H makes arbitrary coverage safe)
  if (logoActive) {
    const eccBudget = ECC_AREA_RATIOS[config.errorCorrectionLevel];
    if (logoWidthRatio > MAX_RECOMMENDED_LOGO_RATIO || logoAreaRatio > eccBudget * 0.55) {
      warnings.push({
        code: 'EXCESSIVE_LOGO_COVERAGE',
        severity: logoWidthRatio > 0.25 ? 'critical' : 'warning',
        title: `Logo covers ${Math.round(logoWidthRatio * 100)}% width`,
        detail:
          'Even at High (H) error correction, oversized logos reduce scan margin in glare or curved surfaces. Keep logos at or below 20% with a clean backdrop.',
        autoFixLabel: 'Shrink Logo to 18%',
      });
    }
  }

  // 6. Low Export Resolution Check
  if (exportSizePx < 400 || moduleSizePx < 4) {
    warnings.push({
      code: 'LOW_RESOLUTION',
      severity: 'warning',
      title: `Low output resolution (${exportSizePx}px / ${moduleSizePx}px per module)`,
      detail:
        'Small raster exports blur rounded modules and finder edges. Use at least 1024px PNG or vector SVG for print.',
      autoFixLabel: 'Set Export to 1024px',
    });
  }

  // 7. Dense Payload Advisory
  if (payloadBytes > 280 || estimatedModules >= 57) {
    warnings.push({
      code: 'DENSE_PAYLOAD',
      severity: 'info',
      title: `Dense QR matrix (~${estimatedModules}x${estimatedModules} modules)`,
      detail:
        'Long payloads create tiny modules. Prefer square/rounded modules, high contrast, and avoid oversized logos.',
    });
  }

  // 8. Transparent Background Advisory
  if (config.background.transparent) {
    warnings.push({
      code: 'TRANSPARENT_BACKGROUND',
      severity: 'warning',
      title: 'Transparent background enabled',
      detail:
        'Scanning reliability depends on whatever color or photo sits behind the exported asset. Only place on clean, light, high-contrast surfaces.',
      autoFixLabel: 'Use Solid White Background',
    });
  }

  return {
    warnings,
    metrics: {
      minContrastRatio: minContrast,
      quietZonePx: config.quietZonePx,
      logoWidthRatio,
      logoAreaRatio,
      estimatedModules,
      moduleSizePx,
      payloadBytes,
    },
  };
}

/**
 * Applies a conservative, explicit safe fix for a given Scan Guard warning code.
 */
export function applySafeFixToDesign(
  current: DesignConfig,
  code: ScanWarningCode,
  currentExportSizePx: number
): { nextConfig: DesignConfig; nextExportSizePx: number } {
  const next = cloneDesignConfig(current);
  let nextExportSizePx = currentExportSizePx;

  switch (code) {
    case 'DECODE_FAILED':
    case 'PAYLOAD_MISMATCH':
      next.dots = {
        type: 'rounded',
        fill: { mode: 'solid', color: '#0F172A' },
      };
      next.cornersSquare = { type: 'square', useCustomColor: true, color: '#0F172A' };
      next.cornersDot = { type: 'square', useCustomColor: true, color: '#0F172A' };
      next.background = { transparent: false, color: '#FFFFFF', cornerRadius: 0 };
      next.quietZonePx = Math.max(20, next.quietZonePx);
      if (next.logo.enabled) {
        next.logo.sizeRatio = Math.min(next.logo.sizeRatio, 0.18);
        next.logo.shape = 'rounded';
        next.logo.backdropColor = '#FFFFFF';
        next.logo.paddingPx = Math.max(6, next.logo.paddingPx);
      }
      next.errorCorrectionLevel = 'Q';
      break;

    case 'INVERTED_COLORS':
    case 'LOW_CONTRAST':
      next.dots.fill = { mode: 'solid', color: '#0F172A' };
      next.cornersSquare.color = '#0F172A';
      next.cornersDot.color = '#0F172A';
      next.background.transparent = false;
      next.background.color = '#FFFFFF';
      break;

    case 'MISSING_QUIET_ZONE':
      next.quietZonePx = 20;
      break;

    case 'EXCESSIVE_LOGO_COVERAGE':
      next.logo.sizeRatio = 0.18;
      next.logo.shape = next.logo.shape === 'none' ? 'rounded' : next.logo.shape;
      next.logo.backdropColor = '#FFFFFF';
      next.logo.paddingPx = Math.max(6, next.logo.paddingPx);
      if (next.errorCorrectionLevel === 'L') {
        next.errorCorrectionLevel = 'M';
      }
      break;

    case 'LOW_RESOLUTION':
      nextExportSizePx = Math.max(1024, currentExportSizePx);
      break;

    case 'TRANSPARENT_BACKGROUND':
      next.background.transparent = false;
      next.background.color = '#FFFFFF';
      break;

    case 'DENSE_PAYLOAD':
      next.dots.type = 'square';
      break;
  }

  return { nextConfig: next, nextExportSizePx };
}
