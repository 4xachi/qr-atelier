import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wrench,
  Check,
  Info,
} from 'lucide-react';
import { useAtelierStore } from '../../editor/state/useAtelierStore';

export function ScanGuardPanel() {
  const scanReport = useAtelierStore((s) => s.scanReport);
  const isVerifying = useAtelierStore((s) => s.isVerifying);
  const payloadValid = useAtelierStore((s) => s.payloadResult.valid);
  const applySafeFix = useAtelierStore((s) => s.applySafeFix);

  if (!payloadValid) {
    return (
      <section
        id="scan-guard-section"
        aria-label="Scan Guard verification"
        className="rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="flex items-center gap-2 text-slate-700">
          <Info className="h-4 w-4 text-slate-500" />
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Scan Guard
          </h2>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Fix the highlighted content fields to generate and verify your QR code.
        </p>
      </section>
    );
  }

  const status = scanReport?.status ?? 'pass';

  const statusMeta =
    status === 'pass'
      ? {
          icon: ShieldCheck,
          label: 'Software Decode Verified',
          tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
          iconColor: 'text-emerald-700',
        }
      : status === 'warning'
      ? {
          icon: AlertTriangle,
          label: 'Decoded with Scan-Risk Warnings',
          tone: 'border-amber-200 bg-amber-50/80 text-amber-950',
          iconColor: 'text-amber-700',
        }
      : {
          icon: XCircle,
          label: 'Scan Guard Failed',
          tone: 'border-red-200 bg-red-50/80 text-red-950',
          iconColor: 'text-red-700',
        };

  const StatusIcon = statusMeta.icon;

  return (
    <section
      id="scan-guard-section"
      aria-label="Scan Guard verification"
      data-testid="scan-guard-panel"
      data-scan-status={scanReport?.status ?? 'pending'}
      className="rounded-xl border border-slate-200 bg-white p-4 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Scan Guard
          </h2>
          <span className="text-xs text-slate-500">
            · Independent ZXing Verification
          </span>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusMeta.tone}`}
        >
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${statusMeta.iconColor}`} />
          <span>{isVerifying ? 'Verifying rendered output...' : statusMeta.label}</span>
        </div>
      </div>

      {scanReport && (
        <>
          {/* Exact Payload Match Check */}
          <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                {scanReport.payloadMatches ? (
                  <Check className="h-3.5 w-3.5 text-emerald-700" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-700" />
                )}
                <span>
                  {scanReport.payloadMatches
                    ? 'Decoded output matches exact expected payload'
                    : scanReport.decodeSuccess
                    ? 'Decoded text differs from expected payload'
                    : 'Decoder could not extract payload from rendered image'}
                </span>
              </div>
              {scanReport.decodedText !== null && (
                <p
                  data-testid="scan-guard-decoded-text"
                  className="mt-1 truncate font-mono text-[11px] text-slate-600"
                >
                  Decoded: {scanReport.decodedText}
                </p>
              )}
            </div>
          </div>

          {/* 4-Column Tabular Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-slate-100 py-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Contrast</div>
              <div
                className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
                  scanReport.metrics.minContrastRatio < 4.5
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {scanReport.metrics.minContrastRatio.toFixed(1)}:1
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Quiet Zone</div>
              <div
                className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
                  scanReport.metrics.quietZonePx < 14
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {scanReport.metrics.quietZonePx}px
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Logo Width</div>
              <div
                className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
                  scanReport.metrics.logoWidthRatio > 0.22
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {scanReport.metrics.logoWidthRatio > 0
                  ? `${Math.round(scanReport.metrics.logoWidthRatio * 100)}%`
                  : 'None'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Matrix</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                ~{scanReport.metrics.estimatedModules}×{scanReport.metrics.estimatedModules}
              </div>
            </div>
          </div>

          {/* Actionable Warnings & One-Click Safe Fixes */}
          {scanReport.warnings.length > 0 && (
            <div className="space-y-2" data-testid="scan-guard-warnings">
              {scanReport.warnings.map((w) => (
                <div
                  key={`${w.code}-${w.title}`}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border p-3 ${
                    w.severity === 'critical'
                      ? 'border-red-200 bg-red-50/70'
                      : w.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/70'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{w.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700">
                      {w.detail}
                    </p>
                  </div>
                  {w.autoFixLabel && (
                    <button
                      type="button"
                      onClick={() => applySafeFix(w.code)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-teal-700 hover:text-teal-800 whitespace-nowrap"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>{w.autoFixLabel}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Honest Software vs Physical Device Disclaimer */}
          <p className="text-[11px] leading-relaxed text-slate-500">
            {scanReport.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}
