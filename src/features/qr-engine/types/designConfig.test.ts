import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DESIGN_CONFIG,
  designConfigSchema,
  migrateAndParseDesignConfig,
  normalizeHex,
  serializeDesignConfig,
} from './designConfig';

test('DEFAULT_DESIGN_CONFIG passes strict schema validation', () => {
  const parsed = designConfigSchema.safeParse(DEFAULT_DESIGN_CONFIG);
  assert.equal(parsed.success, true);
});

test('Invalid hex colors and malformed gradient stops are rejected', () => {
  const badColor = {
    ...DEFAULT_DESIGN_CONFIG,
    background: { ...DEFAULT_DESIGN_CONFIG.background, color: 'red' },
  };
  assert.equal(designConfigSchema.safeParse(badColor).success, false);

  const badGradient = {
    ...DEFAULT_DESIGN_CONFIG,
    dots: {
      type: 'dots' as const,
      fill: {
        mode: 'gradient' as const,
        gradient: {
          type: 'linear' as const,
          rotationDeg: 45,
          stops: [{ offset: 0, color: '#0F172A' }], // must be 2 stops
        },
      },
    },
  };
  assert.equal(designConfigSchema.safeParse(badGradient).success, false);
});

test('Unsupported dot and corner eye shapes are rejected', () => {
  const badDot = {
    ...DEFAULT_DESIGN_CONFIG,
    dots: { ...DEFAULT_DESIGN_CONFIG.dots, type: 'starburst' },
  };
  assert.equal(designConfigSchema.safeParse(badDot).success, false);

  const badEye = {
    ...DEFAULT_DESIGN_CONFIG,
    cornersSquare: { ...DEFAULT_DESIGN_CONFIG.cornersSquare, type: 'triangle' },
  };
  assert.equal(designConfigSchema.safeParse(badEye).success, false);
});

test('Logo size ratio outside safe bounds is rejected', () => {
  const tooLarge = {
    ...DEFAULT_DESIGN_CONFIG,
    logo: { ...DEFAULT_DESIGN_CONFIG.logo, sizeRatio: 0.75 },
  };
  assert.equal(designConfigSchema.safeParse(tooLarge).success, false);
});

test('Serialization and v0 migration round-trip deterministically', () => {
  const serialized = serializeDesignConfig(DEFAULT_DESIGN_CONFIG);
  const parsed = migrateAndParseDesignConfig(serialized);
  assert.deepEqual(parsed, DEFAULT_DESIGN_CONFIG);

  const legacyV0 = {
    errorCorrectionLevel: 'Q',
    quietZonePx: 24,
  };
  const migrated = migrateAndParseDesignConfig(legacyV0);
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.errorCorrectionLevel, 'Q');
  assert.equal(migrated.quietZonePx, 24);
  assert.equal(migrated.frame.captionStyle, 'clean');
  assert.equal(migrated.frame.captionFont, 'sans');
  assert.equal(normalizeHex('#0f7'), '#00FF77');
});

test('Supports 3-stop gradients and extended frame layout options', () => {
  const advanced = {
    ...DEFAULT_DESIGN_CONFIG,
    dots: {
      type: 'extra-rounded' as const,
      fill: {
        mode: 'gradient' as const,
        gradient: {
          type: 'linear' as const,
          rotationDeg: 135,
          stops: [
            { offset: 0, color: '#0F172A' },
            { offset: 0.5, color: '#0369A1' },
            { offset: 1, color: '#0F766E' },
          ],
        },
      },
    },
    frame: {
      ...DEFAULT_DESIGN_CONFIG.frame,
      style: 'ticket' as const,
      captionStyle: 'uppercase' as const,
      captionFont: 'mono' as const,
      shadowEnabled: true,
      accentColor: '#3730A3',
      caption: 'Admit One',
    },
  };
  const parsed = designConfigSchema.safeParse(advanced);
  assert.equal(parsed.success, true);
});
