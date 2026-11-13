import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, Trash2, AlertCircle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { processUploadedLogoFile } from '../image-processing/logoComposer';
import { useAtelierStore } from '../../editor/state/useAtelierStore';
import {
  LOGO_FITS,
  LOGO_SHAPES,
  MAX_RECOMMENDED_LOGO_RATIO,
  type LogoFit,
  type LogoShape,
} from '../../qr-engine/types/designConfig';

const STARTER_MARKS: { id: string; label: string; svg: string }[] = [
  {
    id: 'atelier-mark',
    label: 'Atelier',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#0F766E"/><circle cx="60" cy="60" r="34" fill="#F59E0B"/><path d="M44 60 L60 40 L76 60 L60 80 Z" fill="#0F172A"/></svg>`,
  },
  {
    id: 'link-mark',
    label: 'Link',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="#1E3A8A"/><path d="M48 72 L72 48 M54 44 H76 V66 M66 76 H44 V54" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'wifi-mark',
    label: 'Wi-Fi',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="#0F172A"/><path d="M26 48 Q60 20 94 48 M38 64 Q60 44 82 64 M50 79 Q60 70 70 79" fill="none" stroke="#14B8A6" stroke-width="9" stroke-linecap="round"/><circle cx="60" cy="92" r="6" fill="#FFFFFF"/></svg>`,
  },
  {
    id: 'cafe-mark',
    label: 'Café',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="#292524"/><rect x="34" y="48" width="44" height="34" rx="10" fill="#F59E0B"/><path d="M78 55 H88 A8 8 0 0 1 88 73 H78" fill="none" stroke="#FAF7F2" stroke-width="8" stroke-linecap="round"/><line x1="30" y1="90" x2="84" y2="90" stroke="#FAF7F2" stroke-width="7" stroke-linecap="round"/></svg>`,
  },
];

export function BrandDnaPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const logoAsset = useAtelierStore((s) => s.logoAsset);
  const logoConfig = useAtelierStore((s) => s.designConfig.logo);
  const setLogoAsset = useAtelierStore((s) => s.setLogoAsset);
  const updateDesign = useAtelierStore((s) => s.updateDesign);
  const applyBrandPalette = useAtelierStore((s) => s.applyBrandPalette);

  const handleFile = async (file: File) => {
    setUploadError(null);
    try {
      const processed = await processUploadedLogoFile(file);
      setLogoAsset(processed);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to load image file.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleLoadStarterMark = (mark = STARTER_MARKS[0]) => {
    const sampleFile = new File([mark.svg], `${mark.id}.svg`, {
      type: 'image/svg+xml',
    });
    void handleFile(sampleFile);
  };

  const logoPct = Math.round(logoConfig.sizeRatio * 100);
  const isOverSafeLimit = logoConfig.sizeRatio > MAX_RECOMMENDED_LOGO_RATIO;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Logo &amp; Brand DNA
          </h2>
          {!logoAsset && (
            <button
              type="button"
              onClick={() => handleLoadStarterMark(STARTER_MARKS[0])}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3" />
              <span>Use Sample Mark</span>
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Upload PNG, JPEG, WebP, or SVG (sanitized &amp; processed locally).
        </p>

        <input
          ref={fileInputRef}
          id="brand-logo-upload"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          className="sr-only"
        />

        {!logoAsset ? (
          <div className="mt-3 space-y-2.5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                isDragging
                  ? 'border-teal-700 bg-teal-50/50'
                  : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
              }`}
            >
              <Upload className="mx-auto h-5 w-5 text-slate-500" />
              <p className="mt-2 text-xs font-medium text-slate-700">
                Drop your brand logo here
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Choose Image File
              </button>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-slate-500">
                Or start with a built-in vector mark:
              </span>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {STARTER_MARKS.map((mark) => (
                  <button
                    key={mark.id}
                    type="button"
                    onClick={() => handleLoadStarterMark(mark)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:border-teal-700 hover:text-teal-800"
                  >
                    {mark.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <img
                src={logoAsset.sourceDataUrl}
                alt={`Uploaded logo ${logoAsset.fileName}`}
                className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {logoAsset.fileName}
                </p>
                <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {logoAsset.width}×{logoAsset.height}px
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setLogoAsset(null)}
                  aria-label="Remove uploaded logo"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {logoAsset.wasSanitized && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-2 text-[11px] text-teal-900">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
                <span>{logoAsset.sanitizationNotes.join(' ')}</span>
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{uploadError}</span>
          </p>
        )}
      </div>

      {/* Extracted Dominant Colors & Editable Palette Suggestions */}
      {logoAsset && (
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div>
            <span className="block text-xs font-semibold text-slate-800">
              Extracted Brand Colors
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {logoAsset.dominantColors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={`Apply ${hex} to foreground modules`}
                  onClick={() =>
                    updateDesign((d) => {
                      d.dots.fill = { mode: 'solid', color: hex };
                    })
                  }
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-700 hover:border-slate-400"
                >
                  <span
                    className="h-3 w-3 rounded-sm border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{hex}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-800">
              Suggested Brand Palettes
            </span>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Click to apply; every color remains editable.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {logoAsset.palettes.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => applyBrandPalette(pal)}
                  title={pal.description}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-left transition-colors hover:border-teal-700 hover:bg-teal-50/20"
                >
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {pal.label}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-500 tabular-nums">
                    {pal.contrastRatio.toFixed(1)}:1 contrast
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span
                      className="h-3.5 w-5 rounded-sm border border-black/10"
                      style={{ backgroundColor: pal.dotsColor }}
                    />
                    <span
                      className="h-3.5 w-5 rounded-sm border border-black/10"
                      style={{ backgroundColor: pal.cornersSquareColor }}
                    />
                    <span
                      className="h-3.5 w-5 rounded-sm border border-slate-300"
                      style={{ backgroundColor: pal.backgroundColor }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logo Safe-Area, Fit, Shape & Backdrop Controls */}
      {logoAsset && (
        <div className="border-t border-slate-200 pt-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Logo Placement</span>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={logoConfig.enabled}
                onChange={(e) =>
                  updateDesign((d) => {
                    d.logo.enabled = e.target.checked;
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span>Show in QR</span>
            </label>
          </div>

          {logoConfig.enabled && (
            <>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="logo-size-slider" className="font-medium text-slate-700">
                    Center Size (Safe Area ≤ 22%)
                  </label>
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      isOverSafeLimit ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {logoPct}%
                  </span>
                </div>
                <input
                  id="logo-size-slider"
                  type="range"
                  min={10}
                  max={28}
                  step={1}
                  value={logoPct}
                  onChange={(e) =>
                    updateDesign((d) => {
                      d.logo.sizeRatio = Number(e.target.value) / 100;
                    })
                  }
                  className="mt-1.5 w-full accent-teal-700"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Error correction helps recover obscured modules, but never guarantees oversized logos will scan reliably.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="logo-shape-select" className="block text-xs font-medium text-slate-700">
                    Backdrop Shape
                  </label>
                  <select
                    id="logo-shape-select"
                    value={logoConfig.shape}
                    onChange={(e) =>
                      updateDesign((d) => {
                        d.logo.shape = e.target.value as LogoShape;
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    {LOGO_SHAPES.map((s) => (
                      <option key={s} value={s}>
                        {s === 'none' ? 'No Backdrop' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="logo-fit-select" className="block text-xs font-medium text-slate-700">
                    Image Fit
                  </label>
                  <select
                    id="logo-fit-select"
                    value={logoConfig.fit}
                    onChange={(e) =>
                      updateDesign((d) => {
                        d.logo.fit = e.target.value as LogoFit;
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    {LOGO_FITS.map((f) => (
                      <option key={f} value={f}>
                        {f === 'contain' ? 'Contain (Full Logo)' : 'Cover (Crop Fill)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {logoConfig.shape !== 'none' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="logo-padding-slider" className="font-medium text-slate-700">
                        Inner Padding
                      </label>
                      <span className="font-mono text-xs text-slate-700 tabular-nums">
                        {logoConfig.paddingPx}px
                      </span>
                    </div>
                    <input
                      id="logo-padding-slider"
                      type="range"
                      min={0}
                      max={18}
                      step={1}
                      value={logoConfig.paddingPx}
                      onChange={(e) =>
                        updateDesign((d) => {
                          d.logo.paddingPx = Number(e.target.value);
                        })
                      }
                      className="mt-1 w-full accent-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="logo-backdrop-color" className="block text-xs font-medium text-slate-700">
                        Backdrop Color
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="logo-backdrop-color"
                          type="color"
                          value={logoConfig.backdropColor}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.logo.backdropColor = e.target.value.toUpperCase();
                            })
                          }
                          className="h-8 w-10 rounded border border-slate-300 bg-white p-0.5"
                        />
                        <span className="font-mono text-[11px] text-slate-600">
                          {logoConfig.backdropColor}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="logo-border-width" className="block text-xs font-medium text-slate-700">
                        Border ({logoConfig.borderWidth}px)
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="logo-border-width"
                          type="range"
                          min={0}
                          max={6}
                          step={1}
                          value={logoConfig.borderWidth}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.logo.borderWidth = Number(e.target.value);
                            })
                          }
                          className="w-full accent-teal-700"
                        />
                        <input
                          type="color"
                          aria-label="Logo border color"
                          value={logoConfig.borderColor}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.logo.borderColor = e.target.value.toUpperCase();
                            })
                          }
                          className="h-7 w-7 shrink-0 rounded border border-slate-300 bg-white p-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
