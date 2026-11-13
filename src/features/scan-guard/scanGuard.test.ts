import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { DEFAULT_DESIGN_CONFIG, cloneDesignConfig } from '../qr-engine/types/designConfig';
import { applySafeFixToDesign } from './checks/scanChecks';
import { runScanGuardOnBuffer } from './reports/runScanGuard';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-generator');

/**
 * Renders a deterministic RGBA QR bitmap in Node using qrcode-generator
 * so Scan Guard can be tested end-to-end against ZXing without browser DOM.
 */
function renderQrRgbaFixture(
  payload: string,
  opts: {
    fg?: [number, number, number];
    bg?: [number, number, number];
    quietZoneModules?: number;
    cellSize?: number;
  } = {}
) {
  const qr = qrcode(0, 'M');
  qr.addData(payload);
  qr.make();
  const count = qr.getModuleCount();
  const cell = opts.cellSize ?? 8;
  const marginModules = opts.quietZoneModules ?? 3;
  const totalModules = count + marginModules * 2;
  const size = totalModules * cell;
  const data = new Uint8ClampedArray(size * size * 4);

  const fg = opts.fg ?? [15, 23, 42];
  const bg = opts.bg ?? [255, 255, 255];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mRow = Math.floor(y / cell) - marginModules;
      const mCol = Math.floor(x / cell) - marginModules;
      const isDark =
        mRow >= 0 && mRow < count && mCol >= 0 && mCol < count && qr.isDark(mRow, mCol);
      const [r, g, b] = isDark ? fg : bg;
      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  return { data, width: size, height: size };
}

test('Scan Guard decodes exact payload and passes with safe defaults', () => {
  const payload = 'https://qratelier.design/studio';
  const rgbaBuffer = renderQrRgbaFixture(payload);
  const report = runScanGuardOnBuffer({
    rgbaBuffer,
    expectedPayload: payload,
    config: DEFAULT_DESIGN_CONFIG,
    hasLogoAsset: false,
    exportSizePx: 1024,
  });

  assert.equal(report.decodeSuccess, true);
  assert.equal(report.payloadMatches, true);
  assert.equal(report.decodedText, payload);
  assert.equal(report.status, 'pass');
  assert.match(report.disclaimer, /does not guarantee/i);
});

test('Scan Guard rejects mismatched decoded payload', () => {
  const rgbaBuffer = renderQrRgbaFixture('https://wrong.example');
  const report = runScanGuardOnBuffer({
    rgbaBuffer,
    expectedPayload: 'https://expected.example',
    config: DEFAULT_DESIGN_CONFIG,
    hasLogoAsset: false,
    exportSizePx: 1024,
  });

  assert.equal(report.decodeSuccess, true);
  assert.equal(report.payloadMatches, false);
  assert.equal(report.status, 'fail');
  assert.ok(report.warnings.some((w) => w.code === 'PAYLOAD_MISMATCH'));
});

test('Scan Guard detects decode failure on unreadable low-contrast buffer', () => {
  const payload = 'https://qratelier.design';
  // Near-identical fg and bg so QR matrix cannot be binarized
  const rgbaBuffer = renderQrRgbaFixture(payload, {
    fg: [242, 242, 242],
    bg: [255, 255, 255],
  });
  const cfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  cfg.dots.fill = { mode: 'solid', color: '#F2F2F2' };

  const report = runScanGuardOnBuffer({
    rgbaBuffer,
    expectedPayload: payload,
    config: cfg,
    hasLogoAsset: false,
    exportSizePx: 1024,
  });

  assert.equal(report.decodeSuccess, false);
  assert.equal(report.status, 'fail');
  assert.ok(report.warnings.some((w) => w.code === 'DECODE_FAILED'));
  assert.ok(report.warnings.some((w) => w.code === 'LOW_CONTRAST'));
});

test('Scan Guard flags narrow quiet zone, oversized logo, low resolution, and Safe Fixes recover them', () => {
  const payload = 'https://qratelier.design';
  const rgbaBuffer = renderQrRgbaFixture(payload);
  const riskyCfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  riskyCfg.quietZonePx = 4;
  riskyCfg.logo.enabled = true;
  riskyCfg.logo.sizeRatio = 0.28;

  const report = runScanGuardOnBuffer({
    rgbaBuffer,
    expectedPayload: payload,
    config: riskyCfg,
    hasLogoAsset: true,
    exportSizePx: 256,
  });

  assert.equal(report.status, 'warning');
  assert.ok(report.warnings.some((w) => w.code === 'MISSING_QUIET_ZONE'));
  assert.ok(report.warnings.some((w) => w.code === 'EXCESSIVE_LOGO_COVERAGE'));
  assert.ok(report.warnings.some((w) => w.code === 'LOW_RESOLUTION'));

  const fix1 = applySafeFixToDesign(riskyCfg, 'MISSING_QUIET_ZONE', 256);
  const fix2 = applySafeFixToDesign(fix1.nextConfig, 'EXCESSIVE_LOGO_COVERAGE', fix1.nextExportSizePx);
  const fix3 = applySafeFixToDesign(fix2.nextConfig, 'LOW_RESOLUTION', fix2.nextExportSizePx);

  const recovered = runScanGuardOnBuffer({
    rgbaBuffer,
    expectedPayload: payload,
    config: fix3.nextConfig,
    hasLogoAsset: true,
    exportSizePx: fix3.nextExportSizePx,
  });

  assert.equal(recovered.status, 'pass');
  assert.equal(recovered.warnings.length, 0);
});
