import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DESIGN_CONFIG, cloneDesignConfig } from '../types/designConfig';
import { computeFrameLayout, mapConfigToQrStylingOptions } from './qrEngineAdapter';

test('Adapter passes exact payload and maps supported design options accurately', () => {
  const payload = 'https://qratelier.design/menu?table=12';
  const cfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  cfg.dots.type = 'dots';
  cfg.dots.fill = {
    mode: 'gradient',
    gradient: {
      type: 'linear',
      rotationDeg: 90,
      stops: [
        { offset: 0, color: '#0F172A' },
        { offset: 1, color: '#0F766E' },
      ],
    },
  };
  cfg.cornersSquare = { type: 'extra-rounded', useCustomColor: true, color: '#115E59' };
  cfg.cornersDot = { type: 'dot', useCustomColor: true, color: '#0F172A' };
  cfg.errorCorrectionLevel = 'Q';
  cfg.quietZonePx = 24;

  const opts = mapConfigToQrStylingOptions(payload, cfg, 720, 'data:image/png;base64,AAAA');

  assert.equal(opts.data, payload);
  assert.equal(opts.width, 720);
  assert.equal(opts.height, 720);
  assert.equal(opts.margin, 48); // 24 * (720 / 360)
  assert.equal(opts.qrOptions?.errorCorrectionLevel, 'Q');
  assert.equal(opts.dotsOptions?.type, 'dots');
  assert.equal(opts.dotsOptions?.gradient?.type, 'linear');
  assert.equal(opts.cornersSquareOptions?.type, 'extra-rounded');
  assert.equal(opts.cornersSquareOptions?.color, '#115E59');
  assert.equal(opts.cornersDotOptions?.type, 'dot');
  assert.equal(opts.image, 'data:image/png;base64,AAAA');
  assert.equal(opts.imageOptions?.hideBackgroundDots, true);
});

test('Adapter handles transparent background and disabled logo safely', () => {
  const cfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  cfg.background.transparent = true;
  cfg.logo.enabled = false;

  const opts = mapConfigToQrStylingOptions('hello', cfg, 360, 'data:image/png;base64,AAAA');
  assert.equal(opts.backgroundOptions?.color, 'transparent');
  assert.equal(opts.image, undefined);
});

test('Frame layout calculation accounts for border padding and caption placement deterministically', () => {
  const cfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  cfg.frame.style = 'card';
  cfg.frame.caption = 'Scan for Menu';
  cfg.frame.captionPosition = 'bottom';

  const withCaption = computeFrameLayout(cfg, 720);
  assert.equal(withCaption.totalWidth, 720);
  assert.ok(withCaption.totalHeight > 720);
  assert.equal(withCaption.padding, 40);
  assert.equal(withCaption.qrSize, 640);

  cfg.frame.style = 'none';
  cfg.frame.caption = '';
  const bare = computeFrameLayout(cfg, 720);
  assert.equal(bare.totalWidth, 720);
  assert.equal(bare.totalHeight, 720);
  assert.equal(bare.qrSize, 720);
});

test('Frame layout adds safe outerInset when shadowEnabled is active and expands polaroid caption area', () => {
  const cfg = cloneDesignConfig(DEFAULT_DESIGN_CONFIG);
  cfg.frame.style = 'polaroid';
  cfg.frame.shadowEnabled = true;
  cfg.frame.caption = 'Scan for Menu';

  const layout = computeFrameLayout(cfg, 720);
  assert.equal(layout.outerInset, 20); // 10 * (720/360)
  assert.equal(layout.padding, 40);
  assert.equal(layout.qrSize, 600); // 720 - (40 + 20) * 2
  assert.ok(layout.captionAreaHeight >= 96);
});
