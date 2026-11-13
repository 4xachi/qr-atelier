import { useEffect, useState } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wrench,
} from 'lucide-react';
import {
  canvasToRasterBlob,
  composeExportCanvas,
  composeExportSvg,
  triggerBrowserDownload,
  type RasterExportFormat,
} from '../../qr-engine/adapter/qrEngineAdapter';
import { runScanGuardOnBuffer, type ScanReport } from '../../scan-guard/reports/runScanGuard';
import { useAtelierStore } from '../../editor/state/useAtelierStore';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = RasterExportFormat | 'svg';

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  kind: 'Raster' | 'Vector';
  hint: string;
}[] = [
  {
    id: 'png',
    label: 'PNG',
    kind: 'Raster',
    hint: 'Lossless raster with transparency support for web and slides.',
  },
  {
    id: 'jpeg',
    label: 'JPEG',
    kind: 'Raster',
    hint: 'Compact raster format on a solid white matte (no transparency).',
  },
  {
    id: 'webp',
    label: 'WebP',
    kind: 'Raster',
    hint: 'Lightweight modern web raster with optional transparency.',
  },
  {
    id: 'svg',
    label: 'SVG',
    kind: 'Vector',
    hint: 'Resolution-independent scalable vector XML for print and design tools.',
  },
];

const SIZE_PRESETS = [512, 1024, 2048] as const;

export function ExportModal({ open, onClose }: ExportModalProps) {
  const payloadResult = useAtelierStore((s) => s.payloadResult);
  const designConfig = useAtelierStore((s) => s.designConfig);
  const logoPreviewDataUrl = useAtelierStore((s) => s.logoPreviewDataUrl);
  const logoAsset = useAtelierStore((s) => s.logoAsset);
  const exportSizePx = useAtelierStore((s) => s.exportSizePx);
  const setExportSizePx = useAtelierStore((s) => s.setExportSizePx);
  const updateDesign = useAtelierStore((s) => s.updateDesign);
  const applySafeFix = useAtelierStore((s) => s.applySafeFix);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [svgByteSize, setSvgByteSize] = useState<number | null>(null);
  const [exportVerifyReport, setExportVerifyReport] = useState<ScanReport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Verify the actual exported output whenever modal opens or settings change
  useEffect(() => {
    if (!open || !payloadResult.valid) return;
    let cancelled = false;
    setExportError(null);
    setLastDownloaded(null);

    void (async () => {
      try {
        const verifyPx = Math.min(exportSizePx, 1024);
        const { canvas, svgString } = await composeExportCanvas(
          payloadResult.rawPayload,
          designConfig,
          verifyPx,
          logoPreviewDataUrl
        );
        if (cancelled) return;
        setExportPreviewUrl(canvas.toDataURL('image/png'));
        setSvgByteSize(new Blob([svgString]).size);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const report = runScanGuardOnBuffer({
            rgbaBuffer: {
              data: imageData.data,
              width: imageData.width,
              height: imageData.height,
            },
            expectedPayload: payloadResult.rawPayload,
            config: designConfig,
            hasLogoAsset: Boolean(logoAsset),
            exportSizePx,
          });
          if (!cancelled) {
            setExportVerifyReport(report);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setExportError(
            err instanceof Error ? err.message : 'Failed to prepare export preview.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    payloadResult.valid,
    payloadResult.rawPayload,
    designConfig,
    logoPreviewDataUrl,
    logoAsset,
    exportSizePx,
  ]);

  if (!open) return null;

  const activeFormatMeta =
    FORMAT_OPTIONS.find((f) => f.id === selectedFormat) ?? FORMAT_OPTIONS[0];
  const isVector = selectedFormat === 'svg';

  const handleDownload = async (formatToDownload: ExportFormat = selectedFormat) => {
    if (!payloadResult.valid) return;
    setIsExporting(true);
    setExportError(null);
    try {
      if (formatToDownload === 'svg') {
        const svgString = await composeExportSvg(
          payloadResult.rawPayload,
          designConfig,
          exportSizePx,
          logoPreviewDataUrl
        );
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const filename = `qr-atelier-${payloadResult.contentType}.svg`;
        triggerBrowserDownload(blob, filename);
        setLastDownloaded(filename);
      } else {
        const { canvas } = await composeExportCanvas(
          payloadResult.rawPayload,
          designConfig,
          exportSizePx,
          logoPreviewDataUrl
        );
        const blob = await canvasToRasterBlob(canvas, formatToDownload);
        const filename = `qr-atelier-${payloadResult.contentType}-${exportSizePx}px.${formatToDownload}`;
        triggerBrowserDownload(blob, filename);
        setLastDownloaded(filename);
      }
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : `${formatToDownload.toUpperCase()} export failed.`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const status = exportVerifyReport?.status ?? 'pass';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="export-modal-title" className="font-display text-lg font-semibold text-slate-900">
              Export QR Asset
            </h2>
            <p className="text-xs text-slate-500">
              Free raster (PNG, JPEG, WebP) &amp; vector (SVG) exports · No watermarks · No quotas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left: Exported Asset Preview & Verification */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div
              className={`flex items-center justify-center rounded-lg p-3 ${
                designConfig.background.transparent && selectedFormat !== 'jpeg'
                  ? 'checkerboard-bg'
                  : 'bg-white'
              }`}
            >
              {exportPreviewUrl ? (
                <img
                  src={exportPreviewUrl}
                  alt="Verified export asset preview"
                  className="h-44 w-44 object-contain"
                />
              ) : (
                <div className="h-44 w-44 animate-pulse rounded bg-slate-200" />
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-slate-500 tabular-nums">
              <span>{isVector ? 'Vector SVG' : `${selectedFormat.toUpperCase()} Raster`}</span>
              <span aria-hidden="true">·</span>
              <span>
                {isVector
                  ? `ViewBox ${exportSizePx}px`
                  : `${exportSizePx}×${exportSizePx}px`}
              </span>
              {isVector && svgByteSize !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{(svgByteSize / 1024).toFixed(1)} KB</span>
                </>
              )}
            </div>

            {exportVerifyReport && (
              <div
                className={`mt-3 w-full rounded-lg border px-3 py-2 text-xs ${
                  status === 'pass'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : status === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                    : 'border-red-200 bg-red-50 text-red-950'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {status === 'pass' ? (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                  ) : status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                  )}
                  <span>
                    {exportVerifyReport.payloadMatches
                      ? isVector
                        ? 'Vector SVG rasterized & decoded to exact payload'
                        : 'Export raster decoded to exact payload'
                      : 'Export verification detected a scan failure'}
                  </span>
                </div>
                {exportVerifyReport.warnings.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {exportVerifyReport.warnings.slice(0, 2).map((w) => (
                      <div key={w.code} className="flex items-center justify-between gap-2 text-[11px]">
                        <span>{w.title}</span>
                        {w.autoFixLabel && (
                          <button
                            type="button"
                            onClick={() => applySafeFix(w.code)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-800 hover:border-teal-700 whitespace-nowrap"
                          >
                            <Wrench className="h-3 w-3" />
                            <span>Fix</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Format Selector, Size, Transparency & Download Action */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Format Selector (Raster & Vector SVG) */}
              <div>
                <span className="block text-xs font-semibold text-slate-800">
                  File Format
                </span>
                <div
                  role="radiogroup"
                  aria-label="Export file format"
                  className="mt-2 grid grid-cols-4 gap-1.5"
                >
                  {FORMAT_OPTIONS.map((fmt) => {
                    const active = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                          active
                            ? 'border-teal-700 bg-teal-50 text-teal-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{fmt.label}</div>
                        <div className="text-[10px] text-slate-500">{fmt.kind}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">{activeFormatMeta.hint}</p>
              </div>

              {/* Resolution / ViewBox Sizing */}
              <div className="border-t border-slate-200 pt-3.5">
                <span className="block text-xs font-semibold text-slate-800">
                  {isVector ? 'SVG Base ViewBox Scale' : 'Raster Output Resolution'}
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {SIZE_PRESETS.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      aria-pressed={exportSizePx === sz}
                      onClick={() => setExportSizePx(sz)}
                      className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                        exportSizePx === sz
                          ? 'border-teal-700 bg-teal-50 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor="custom-export-size" className="text-xs font-medium text-slate-600">
                    Custom:
                  </label>
                  <input
                    id="custom-export-size"
                    type="number"
                    min={256}
                    max={4096}
                    step={64}
                    value={exportSizePx}
                    onChange={(e) => setExportSizePx(Number(e.target.value) || 1024)}
                    className="w-24 rounded-lg border border-slate-300 px-2.5 py-1 font-mono text-xs text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">px (256–4096)</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3.5">
                <label className="flex items-start gap-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={designConfig.background.transparent}
                    disabled={selectedFormat === 'jpeg'}
                    onChange={(e) =>
                      updateDesign((d) => {
                        d.background.transparent = e.target.checked;
                      })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 disabled:opacity-40"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Transparent Background
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {selectedFormat === 'jpeg'
                        ? 'JPEG exports automatically matte onto white (no alpha channel).'
                        : 'Safe only when placing your QR over clean, light, high-contrast backgrounds.'}
                    </p>
                  </div>
                </label>
              </div>

              {exportError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                  {exportError}
                </p>
              )}

              {lastDownloaded && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800"
                >
                  Downloaded {lastDownloaded}
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-3.5">
              <button
                type="button"
                onClick={() => void handleDownload(selectedFormat)}
                disabled={isExporting || !payloadResult.valid}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                <span>
                  {isVector
                    ? 'Download SVG (Vector)'
                    : `Download ${selectedFormat.toUpperCase()} (${exportSizePx}px)`}
                </span>
              </button>
              <p className="text-center text-[11px] text-slate-500">
                Exact payload preserved · Switch between PNG, JPEG, WebP &amp; Vector SVG above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
