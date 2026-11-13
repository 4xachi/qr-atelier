import test from 'node:test';
import assert from 'node:assert/strict';
import { useAtelierStore } from './useAtelierStore';

test('Store keeps payload separate from designConfig and supports undo/redo/reset', () => {
  const store = useAtelierStore;
  store.getState().resetToDefault();

  const initialFill = store.getState().designConfig.dots.fill;
  const initialColor = initialFill.mode === 'solid' ? initialFill.color : '';
  assert.equal(initialColor, '#0F172A');

  // Update design color
  store.getState().updateDesign((d) => {
    d.dots.type = 'dots';
    d.dots.fill = { mode: 'solid', color: '#1E3A8A' };
  });
  assert.equal(store.getState().designConfig.dots.type, 'dots');
  assert.equal(store.getState().pastConfigs.length > 0, true);

  // Undo restores previous state
  store.getState().undo();
  assert.equal(store.getState().designConfig.dots.type, 'rounded');

  // Redo reapplies change
  store.getState().redo();
  assert.equal(store.getState().designConfig.dots.type, 'dots');

  // Apply preset populates editable controls without locking
  store.getState().applyPreset('luxury');
  assert.equal(store.getState().activePresetId, 'luxury');
  assert.equal(store.getState().designConfig.dots.type, 'classy-rounded');

  // User can edit preset freely
  store.getState().updateDesign((d) => {
    d.frame.caption = 'VIP Access';
  });
  assert.equal(store.getState().designConfig.frame.caption, 'VIP Access');

  // Reset to preset restores Luxury without caption
  store.getState().resetToPreset();
  assert.equal(store.getState().designConfig.frame.caption, '');
  assert.equal(store.getState().designConfig.dots.type, 'classy-rounded');

  // Reset to default restores corporate default
  store.getState().resetToDefault();
  assert.equal(store.getState().activePresetId, 'corporate');
  assert.equal(store.getState().designConfig.dots.type, 'rounded');
});

test('Store applies Safe Fix to resolve risky settings', () => {
  const store = useAtelierStore;
  store.getState().resetToDefault();
  store.getState().updateDesign((d) => {
    d.quietZonePx = 2;
  });
  assert.equal(store.getState().designConfig.quietZonePx, 2);

  store.getState().applySafeFix('MISSING_QUIET_ZONE');
  assert.equal(store.getState().designConfig.quietZonePx, 20);
});

test('All curated presets validate cleanly and store supports inspectorMode + JSON import with undo', async () => {
  const { CURATED_PRESETS } = await import('../presets/presets');
  const { designConfigSchema } = await import('../../qr-engine/types/designConfig');

  assert.ok(CURATED_PRESETS.length >= 20);
  const ranks = CURATED_PRESETS.map((p) => p.recommendedRank)
    .filter((r): r is number => typeof r === 'number')
    .sort((a, b) => a - b);
  assert.deepEqual(ranks, [1, 2, 3, 4, 5]);
  for (const preset of CURATED_PRESETS) {
    const res = designConfigSchema.safeParse(preset.config);
    assert.equal(res.success, true, `Preset ${preset.id} failed schema validation`);
  }

  const store = useAtelierStore;
  store.getState().resetToDefault();
  assert.equal(store.getState().inspectorMode, 'standard');
  store.getState().setInspectorMode('advanced');
  assert.equal(store.getState().inspectorMode, 'advanced');

  store.getState().applyPreset('event-pass');
  assert.equal(store.getState().designConfig.frame.style, 'ticket');
  assert.equal(store.getState().designConfig.frame.captionStyle, 'uppercase');

  const imported = CURATED_PRESETS.find((p) => p.id === 'viewfinder')!.config;
  store.getState().importDesignConfig(imported);
  assert.equal(store.getState().designConfig.frame.style, 'corner-brackets');

  store.getState().undo();
  assert.equal(store.getState().designConfig.frame.style, 'ticket');
});
