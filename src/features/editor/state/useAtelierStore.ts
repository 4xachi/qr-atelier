import { create } from 'zustand';
import type { LoadedLogoAsset } from '../../brand-dna/image-processing/logoComposer';
import type { BrandPaletteSuggestion } from '../../brand-dna/palette/colorMath';
import { buildQrPayload } from '../../content/payload-builders/buildPayload';
import {
  type ContentFormsState,
  type ContentType,
  DEFAULT_CONTENT_FORMS,
  type QrPayloadResult,
} from '../../content/schemas/payloadSchemas';
import {
  DEFAULT_DESIGN_CONFIG,
  type DesignConfig,
  cloneDesignConfig,
} from '../../qr-engine/types/designConfig';
import { applySafeFixToDesign, type ScanWarningCode } from '../../scan-guard/checks/scanChecks';
import type { ScanReport } from '../../scan-guard/reports/runScanGuard';
import { getPresetById } from '../presets/presets';

const MAX_HISTORY = 40;

export interface AtelierState {
  // Content model (kept cleanly separate from visual styling)
  contentType: ContentType;
  contentForms: ContentFormsState;
  payloadResult: QrPayloadResult;

  // Design configuration + Undo/Redo history
  activePresetId: string;
  inspectorMode: 'standard' | 'advanced';
  designConfig: DesignConfig;
  pastConfigs: DesignConfig[];
  futureConfigs: DesignConfig[];

  // Brand DNA & Logo
  logoAsset: LoadedLogoAsset | null;
  logoPreviewDataUrl: string | null;

  // Scan Guard & Export settings
  exportSizePx: number;
  scanReport: ScanReport | null;
  isVerifying: boolean;

  // Actions
  setContentType: (type: ContentType) => void;
  updateContentField: <K extends ContentType>(
    type: K,
    patch: Partial<ContentFormsState[K]>
  ) => void;

  setInspectorMode: (mode: 'standard' | 'advanced') => void;
  updateDesign: (updater: (draft: DesignConfig) => void) => void;
  importDesignConfig: (nextConfig: DesignConfig) => void;
  applyPreset: (presetId: string) => void;
  resetToPreset: () => void;
  resetToDefault: () => void;
  undo: () => void;
  redo: () => void;

  setLogoAsset: (asset: LoadedLogoAsset | null) => void;
  setLogoPreviewDataUrl: (url: string | null) => void;
  applyBrandPalette: (palette: BrandPaletteSuggestion) => void;

  setExportSizePx: (sizePx: number) => void;
  setScanReport: (report: ScanReport | null) => void;
  setIsVerifying: (verifying: boolean) => void;
  applySafeFix: (code: ScanWarningCode) => void;
}

const initialPayload = buildQrPayload('url', DEFAULT_CONTENT_FORMS);

export const useAtelierStore = create<AtelierState>((set, get) => ({
  contentType: 'url',
  contentForms: DEFAULT_CONTENT_FORMS,
  payloadResult: initialPayload,

  activePresetId: 'corporate',
  inspectorMode: 'standard',
  designConfig: cloneDesignConfig(DEFAULT_DESIGN_CONFIG),
  pastConfigs: [],
  futureConfigs: [],

  logoAsset: null,
  logoPreviewDataUrl: null,

  exportSizePx: 1024,
  scanReport: null,
  isVerifying: false,

  setContentType: (contentType) => {
    const forms = get().contentForms;
    set({
      contentType,
      payloadResult: buildQrPayload(contentType, forms),
    });
  },

  updateContentField: (type, patch) => {
    const currentForms = get().contentForms;
    const nextForms: ContentFormsState = {
      ...currentForms,
      [type]: {
        ...currentForms[type],
        ...patch,
      },
    };
    const activeType = get().contentType;
    set({
      contentForms: nextForms,
      payloadResult: buildQrPayload(activeType, nextForms),
    });
  },

  setInspectorMode: (inspectorMode) => set({ inspectorMode }),

  updateDesign: (updater) => {
    const current = get().designConfig;
    const snapshot = cloneDesignConfig(current);
    const next = cloneDesignConfig(current);
    updater(next);

    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      designConfig: next,
      pastConfigs: past,
      futureConfigs: [],
    });
  },

  importDesignConfig: (nextConfig) => {
    const current = get().designConfig;
    const snapshot = cloneDesignConfig(current);
    const next = cloneDesignConfig(nextConfig);
    if (get().logoAsset) {
      next.logo.enabled = current.logo.enabled;
    }
    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      designConfig: next,
      pastConfigs: past,
      futureConfigs: [],
    });
  },

  applyPreset: (presetId) => {
    const preset = getPresetById(presetId);
    const current = get().designConfig;
    const snapshot = cloneDesignConfig(current);
    const next = cloneDesignConfig(preset.config);
    // Preserve user's logo enablement/size if they already uploaded a logo
    if (get().logoAsset) {
      next.logo.enabled = current.logo.enabled;
    }

    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      activePresetId: preset.id,
      designConfig: next,
      pastConfigs: past,
      futureConfigs: [],
    });
  },

  resetToPreset: () => {
    const preset = getPresetById(get().activePresetId);
    const snapshot = cloneDesignConfig(get().designConfig);
    const next = cloneDesignConfig(preset.config);
    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      designConfig: next,
      pastConfigs: past,
      futureConfigs: [],
    });
  },

  resetToDefault: () => {
    const snapshot = cloneDesignConfig(get().designConfig);
    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      activePresetId: 'corporate',
      designConfig: cloneDesignConfig(DEFAULT_DESIGN_CONFIG),
      pastConfigs: past,
      futureConfigs: [],
    });
  },

  undo: () => {
    const past = get().pastConfigs;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = cloneDesignConfig(get().designConfig);
    set({
      designConfig: previous,
      pastConfigs: past.slice(0, -1),
      futureConfigs: [current, ...get().futureConfigs].slice(0, MAX_HISTORY),
    });
  },

  redo: () => {
    const future = get().futureConfigs;
    if (future.length === 0) return;
    const next = future[0];
    const current = cloneDesignConfig(get().designConfig);
    set({
      designConfig: next,
      pastConfigs: [...get().pastConfigs, current].slice(-MAX_HISTORY),
      futureConfigs: future.slice(1),
    });
  },

  setLogoAsset: (asset) => {
    set({
      logoAsset: asset,
      logoPreviewDataUrl: asset ? asset.sourceDataUrl : null,
    });
    if (asset) {
      get().updateDesign((draft) => {
        draft.logo.enabled = true;
      });
    }
  },

  setLogoPreviewDataUrl: (url) => set({ logoPreviewDataUrl: url }),

  applyBrandPalette: (palette) => {
    get().updateDesign((draft) => {
      if (palette.dotsSecondaryColor && palette.id === 'brand-dominant') {
        draft.dots.fill = {
          mode: 'gradient',
          gradient: {
            type: 'linear',
            rotationDeg: 135,
            stops: [
              { offset: 0, color: palette.dotsColor },
              { offset: 1, color: palette.dotsSecondaryColor },
            ],
          },
        };
      } else {
        draft.dots.fill = {
          mode: 'solid',
          color: palette.dotsColor,
        };
      }
      draft.cornersSquare.useCustomColor = true;
      draft.cornersSquare.color = palette.cornersSquareColor;
      draft.cornersDot.useCustomColor = true;
      draft.cornersDot.color = palette.cornersDotColor;
      draft.background.transparent = false;
      draft.background.color = palette.backgroundColor;
      draft.frame.frameColor = palette.backgroundColor;
      draft.frame.captionColor = palette.dotsColor;
    });
  },

  setExportSizePx: (exportSizePx) =>
    set({ exportSizePx: Math.max(128, Math.min(4096, Math.round(exportSizePx))) }),

  setScanReport: (scanReport) => set({ scanReport }),
  setIsVerifying: (isVerifying) => set({ isVerifying }),

  applySafeFix: (code) => {
    const { designConfig, exportSizePx } = get();
    const { nextConfig, nextExportSizePx } = applySafeFixToDesign(
      designConfig,
      code,
      exportSizePx
    );
    const snapshot = cloneDesignConfig(designConfig);
    const past = [...get().pastConfigs, snapshot].slice(-MAX_HISTORY);
    set({
      designConfig: nextConfig,
      exportSizePx: nextExportSizePx,
      pastConfigs: past,
      futureConfigs: [],
    });
  },
}));
