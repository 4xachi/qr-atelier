import { useEffect, useState } from 'react';
import { Undo2, Redo2, RotateCcw, RefreshCw, AlertCircle } from 'lucide-react';
import { composeStyledLogoDataUrl } from '../../brand-dna/image-processing/logoComposer';
import { composeExportCanvas } from '../../qr-engine/adapter/qrEngineAdapter';
import { getPresetById } from '../presets/presets';
import { useAtelierStore } from '../state/useAtelierStore';

export function LiveCanvasStage() {
  const payloadResult = useAtelierStore((s) => s.payloadResult);
  const activePresetId = useAtelierStore((s) => s.activePresetId);
  const designConfig = useAtelierStore((s) => s.designConfig);
  const exportSizePx = useAtelierStore((s) => s.exportSizePx);
  const logoAsset = useAtelierStore((s) => s.logoAsset);
  const logoPreviewDataUrl = useAtelierStore((s) => s.logoPreviewDataUrl);
  const pastCount = useAtelierStore((s) => s.pastConfigs.length);
  const futureCount = useAtelierStore((s) => s.futureConfigs.length);

  const undo = useAtelierStore((s) => s.undo);
  const redo = useAtelierStore((s) => s.redo);
  const resetToPreset = useAtelierStore((s) => s.resetToPreset);
  const resetToDefault = useAtelierStore((s) => s.resetToDefault);
  const setLogoPreviewDataUrl = useAtelierStore((s) => s.setLogoPreviewDataUrl);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [surfaceMat, setSurfaceMat] = useState<'light' | 'dark'>('light');

  const activePreset = getPresetById(activePresetId);

  // Re-compose styled logo badge whenever logo asset or logo styling changes
  useEffect(() => {
    let cancelled = false;
    if (!logoAsset) {
      setLogoPreviewDataUrl(null);
      return;
    }
    void composeStyledLogoDataUrl(logoAsset.sourceDataUrl, designConfig.logo)
      .then((url) => {
        if (!cancelled) setLogoPreviewDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLogoPreviewDataUrl(logoAsset.sourceDataUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [logoAsset, designConfig.logo, setLogoPreviewDataUrl]);

  // Debounced live QR rendering
  useEffect(() => {
    if (!payloadResult.valid) {
      return;
    }

    let cancelled = false;
    setRenderError(null);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const previewSize = 360;
          const { canvas } = await composeExportCanvas(
            payloadResult.rawPayload,
            designConfig,
            previewSize,
            logoPreviewDataUrl
          );
          if (cancelled) return;

          const dataUrl = canvas.toDataURL('image/png');
          setPreviewDataUrl(dataUrl);
        } catch (err) {
          if (!cancelled) {
            setRenderError(err instanceof Error ? err.message : 'Unable to render QR preview.');
          }
        }
      })();
    }, 90);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    payloadResult.valid,
    payloadResult.rawPayload,
    designConfig,
    logoPreviewDataUrl,
  ]);

  return (
    <div className="flex flex-col gap-4">
      {/* Studio Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={pastCount === 0}
            aria-label="Undo last design change"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={futureCount === 0}
            aria-label="Redo design change"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-1 hidden sm:flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setSurfaceMat('light')}
              className={`rounded-md px-2 py-1 whitespace-nowrap ${
                surfaceMat === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Light Mat
            </button>
            <button
              type="button"
              onClick={() => setSurfaceMat('dark')}
              className={`rounded-md px-2 py-1 whitespace-nowrap ${
                surfaceMat === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Dark Mat
            </button>
          </div>

          <button
            type="button"
            onClick={resetToPreset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Preset</span>
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Default</span>
          </button>
        </div>
      </div>

      {/* Live QR Artboard */}
      <div
        data-testid="qr-preview-stage"
        data-payload-valid={payloadResult.valid}
        className={`relative flex min-h-[460px] flex-col items-center justify-center rounded-xl border border-slate-200 p-6 sm:p-10 transition-colors ${
          surfaceMat === 'dark'
            ? 'bg-slate-900'
            : designConfig.background.transparent
            ? 'checkerboard-bg'
            : 'studio-grid-bg'
        }`}
      >
        {!payloadResult.valid ? (
          <div className="max-w-xs rounded-xl border border-red-200 bg-white p-5 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-red-700" />
            <p className="mt-2 text-sm font-semibold text-slate-900">
              Complete required content fields
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {Object.values(payloadResult.errors)[0] || 'Enter valid QR content to render preview.'}
            </p>
          </div>
        ) : renderError ? (
          <div className="max-w-xs rounded-xl border border-red-200 bg-white p-5 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-red-700" />
            <p className="mt-2 text-xs font-medium text-red-700">{renderError}</p>
          </div>
        ) : previewDataUrl ? (
          <div className="flex flex-col items-center">
            <img
              src={previewDataUrl}
              alt="Live styled QR code preview"
              data-testid="qr-preview-image"
              className="h-auto w-[300px] sm:w-[350px] max-w-full rounded-lg"
            />
            <div
              className={`mt-4 flex items-center gap-2 text-[11px] font-medium ${
                surfaceMat === 'dark' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              <span>Template: {activePreset.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{exportSizePx}px export</span>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-[300px] animate-pulse rounded-xl bg-slate-200" />
        )}
      </div>
    </div>
  );
}
