import { useEffect } from 'react';
import { X, ShieldCheck, Lock, Printer } from 'lucide-react';

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="privacy-modal-title" className="font-display text-lg font-semibold text-slate-900">
              Local-First Privacy &amp; Static QR Guarantee
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Your brand · Your style · Your QR
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy dialog"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <div>
              <p className="font-medium text-slate-900">100% Browser-Only Processing</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                Payloads, Wi-Fi passwords, contact vCards, uploaded logos, and Scan Guard decoding never leave your browser. Nothing is uploaded to a server.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Printer className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <div>
              <p className="font-medium text-slate-900">Static Codes by Default</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                QR Atelier encodes your exact payload directly into the matrix without tracking redirects or link shorteners. Destinations cannot be edited after printing, and codes never expire.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <div>
              <p className="font-medium text-slate-900">Free-First Exports</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                PNG and SVG exports, Brand DNA color extraction, custom logos, and Scan Guard verification are all free with zero watermarks, zero accounts, and zero quotas.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Back to Studio
          </button>
        </div>
      </div>
    </div>
  );
}
