import type { DesignConfig } from '../../qr-engine/types/designConfig';
import {
  evaluateScanRisks,
  type ScanMetrics,
  type ScanWarning,
} from '../checks/scanChecks';
import {
  decodeQrFromRgba,
  type RgbaImageBuffer,
} from '../decoder/qrDecoder';

export type ScanGuardStatus = 'pass' | 'warning' | 'fail';

export interface ScanReport {
  status: ScanGuardStatus;
  decodeSuccess: boolean;
  payloadMatches: boolean;
  decodedText: string | null;
  expectedPayload: string;
  decodedInverted: boolean;
  warnings: ScanWarning[];
  metrics: ScanMetrics;
  disclaimer: string;
  verifiedAtIso: string;
}

export const HONEST_SCAN_DISCLAIMER =
  'Software decode verified against exact payload. This does not guarantee every physical phone camera or print surface will scan in all lighting — test printed proofs on real devices.';

export function runScanGuardOnBuffer(params: {
  rgbaBuffer: RgbaImageBuffer;
  expectedPayload: string;
  config: DesignConfig;
  hasLogoAsset: boolean;
  exportSizePx: number;
}): ScanReport {
  const decode = decodeQrFromRgba(params.rgbaBuffer);
  const payloadMatches = Boolean(decode.success && decode.text === params.expectedPayload);

  const { warnings, metrics } = evaluateScanRisks({
    expectedPayload: params.expectedPayload,
    config: params.config,
    hasLogoAsset: params.hasLogoAsset,
    exportSizePx: params.exportSizePx,
    decodeSuccess: decode.success,
    decodedText: decode.text,
    decodedInverted: decode.inverted,
  });

  const hasCritical =
    !decode.success ||
    !payloadMatches ||
    warnings.some((w) => w.severity === 'critical');

  const hasWarning = warnings.some((w) => w.severity === 'warning');

  const status: ScanGuardStatus = !decode.success || !payloadMatches
    ? 'fail'
    : hasCritical || hasWarning
    ? 'warning'
    : 'pass';

  return {
    status,
    decodeSuccess: decode.success,
    payloadMatches,
    decodedText: decode.text,
    expectedPayload: params.expectedPayload,
    decodedInverted: decode.inverted,
    warnings,
    metrics,
    disclaimer: HONEST_SCAN_DISCLAIMER,
    verifiedAtIso: new Date().toISOString(),
  };
}
