import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CAPTION_FONTS,
  CAPTION_STYLES,
  ERROR_CORRECTION_LEVELS,
  FRAME_STYLES,
  SUPPORTED_CORNER_DOT_TYPES,
  SUPPORTED_CORNER_SQUARE_TYPES,
  SUPPORTED_DOT_TYPES,
  migrateAndParseDesignConfig,
  serializeDesignConfig,
  type CaptionFont,
  type CaptionPosition,
  type CaptionStyle,
  type ErrorCorrectionLevel,
  type FrameStyle,
  type GradientType,
  type SupportedCornerDotType,
  type SupportedCornerSquareType,
  type SupportedDotType,
} from '../../qr-engine/types/designConfig';
import { computeMinimumDesignContrast } from '../../scan-guard/checks/scanChecks';
import {
  DotShapeGlyph,
  EyeFrameGlyph,
  EyePupilGlyph,
  FrameStyleGlyph,
} from '../components/DesignVisualGlyphs';
import { useAtelierStore } from '../state/useAtelierStore';

type InspectorTab = 'modules' | 'colors' | 'frame';

const DOT_LABELS: Record<SupportedDotType, string> = {
  square: 'Square',
  dots: 'Dots',
  rounded: 'Rounded',
  'extra-rounded': 'Extra Rounded',
  classy: 'Classy',
  'classy-rounded': 'Classy Rounded',
};

const EYE_FRAME_LABELS: Record<SupportedCornerSquareType, string> = {
  square: 'Square',
  dot: 'Circle',
  'extra-rounded': 'Rounded',
};

const EYE_PUPIL_LABELS: Record<SupportedCornerDotType, string> = {
  square: 'Square',
  dot: 'Dot',
};

const FRAME_LABELS: Record<FrameStyle, string> = {
  none: 'None',
  card: 'Studio Card',
  'minimal-border': 'Minimal Border',
  'badge-bottom': 'Badge Banner',
  'scan-pill': 'Scan Pill',
  'corner-brackets': 'Viewfinder',
  polaroid: 'Polaroid',
  ticket: 'Event Ticket',
};

const CAPTION_PRESETS = [
  'Scan Me',
  'Scan for Menu',
  'Connect Wi-Fi',
  'Get Tickets',
] as const;

const COLOR_HARMONIES: {
  id: string;
  label: string;
  ink: string;
  eye: string;
  bg: string;
  accent: string;
}[] = [
  { id: 'atelier-teal', label: 'Atelier Teal', ink: '#0F172A', eye: '#0F766E', bg: '#FFFFFF', accent: '#0F766E' },
  { id: 'midnight-ink', label: 'Midnight Ink', ink: '#000000', eye: '#000000', bg: '#FFFFFF', accent: '#0F172A' },
  { id: 'cobalt-ocean', label: 'Cobalt Ocean', ink: '#1E3A8A', eye: '#0369A1', bg: '#F8FAFC', accent: '#0369A1' },
  { id: 'espresso-warm', label: 'Espresso Linen', ink: '#292524', eye: '#B45309', bg: '#FAF7F2', accent: '#B45309' },
  { id: 'forest-pine', label: 'Forest Pine', ink: '#14532D', eye: '#15803D', bg: '#F7FBF8', accent: '#15803D' },
  { id: 'crimson-press', label: 'Crimson Press', ink: '#312E81', eye: '#BE123C', bg: '#FFFFFF', accent: '#BE123C' },
];

const QUIET_ZONE_PRESETS = [
  { label: 'Compact', px: 12 },
  { label: 'Balanced', px: 20 },
  { label: 'Print Safe', px: 32 },
] as const;

function ColorInputRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setDraft(next);
            onChange(next);
          }}
          className="h-8 w-9 rounded border border-slate-300 bg-white p-0.5"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={draft}
          maxLength={7}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const trimmed = raw.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
              onChange(trimmed.toUpperCase());
            }
          }}
          onBlur={() => setDraft(value)}
          className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-800 uppercase focus:border-teal-700 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function DesignInspector() {
  const [tab, setTab] = useState<InspectorTab>('modules');
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedStyle, setCopiedStyle] = useState(false);

  const config = useAtelierStore((s) => s.designConfig);
  const inspectorMode = useAtelierStore((s) => s.inspectorMode);
  const setInspectorMode = useAtelierStore((s) => s.setInspectorMode);
  const updateDesign = useAtelierStore((s) => s.updateDesign);
  const importDesignConfig = useAtelierStore((s) => s.importDesignConfig);

  const isAdvanced = inspectorMode === 'advanced';

  const solidColor =
    config.dots.fill.mode === 'solid'
      ? config.dots.fill.color
      : config.dots.fill.gradient.stops[0]?.color ?? '#0F172A';

  const { minContrast, hasInvertedComponent } = computeMinimumDesignContrast(config);
  const contrastStatus =
    minContrast >= 4.5
      ? { label: 'Scan Safe', tone: 'text-emerald-700' }
      : minContrast >= 3.0
      ? { label: 'Moderate', tone: 'text-amber-700' }
      : { label: 'Low Contrast', tone: 'text-red-700' };

  const handleSwapColors = () => {
    updateDesign((d) => {
      const currentBg = d.background.transparent ? '#FFFFFF' : d.background.color;
      const currentFg =
        d.dots.fill.mode === 'solid'
          ? d.dots.fill.color
          : d.dots.fill.gradient.stops[0]?.color ?? '#0F172A';
      d.dots.fill = { mode: 'solid', color: currentBg };
      d.background.transparent = false;
      d.background.color = currentFg;
      if (d.frame.style !== 'none') {
        d.frame.frameColor = currentFg;
        if (d.frame.captionStyle !== 'pill' && d.frame.style !== 'scan-pill') {
          d.frame.captionColor = currentBg;
        }
      }
      if (d.cornersSquare.useCustomColor) {
        d.cornersSquare.color = currentBg;
      }
      if (d.cornersDot.useCustomColor) {
        d.cornersDot.color = currentBg;
      }
    });
  };

  const handleCopyStyleJson = async () => {
    try {
      const serialized = serializeDesignConfig(config);
      await navigator.clipboard?.writeText(serialized);
      setCopiedStyle(true);
      setTimeout(() => setCopiedStyle(false), 1800);
    } catch {
      setJsonImportOpen(true);
      setJsonDraft(serializeDesignConfig(config));
    }
  };

  const handleApplyStyleJson = () => {
    setJsonError(null);
    try {
      const parsed = migrateAndParseDesignConfig(jsonDraft);
      importDesignConfig(parsed);
      setJsonImportOpen(false);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid QR Atelier design JSON.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Design Inspector
          </h2>
          <div
            role="group"
            aria-label="Customization depth"
            className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold"
          >
            <button
              type="button"
              aria-pressed={!isAdvanced}
              onClick={() => setInspectorMode('standard')}
              className={`rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                !isAdvanced
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              aria-pressed={isAdvanced}
              onClick={() => setInspectorMode('advanced')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors whitespace-nowrap ${
                isAdvanced
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Advanced</span>
            </button>
          </div>
        </div>

        {/* Live Contrast Readout */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {hasInvertedComponent ? 'Inverted ink' : 'Dark-on-light'}
            {' · '}
            ECC {config.errorCorrectionLevel}
          </span>
          <span className={`font-mono font-semibold tabular-nums ${contrastStatus.tone}`}>
            {minContrast.toFixed(1)}:1 · {contrastStatus.label}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Design inspector categories"
          className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
        >
          {(
            [
              { id: 'modules', label: 'Geometry' },
              { id: 'colors', label: 'Colors' },
              { id: 'frame', label: 'Frame' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {tab === 'modules' && (
          <>
            <div>
              <span className="block text-xs font-semibold text-slate-800">
                Data Module Shape
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {SUPPORTED_DOT_TYPES.map((shape) => {
                  const active = config.dots.type === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.dots.type = shape;
                        })
                      }
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <DotShapeGlyph type={shape} active={active} />
                      <span className="truncate">{DOT_LABELS[shape]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="block text-xs font-semibold text-slate-800">
                Finder Eye Frame
              </span>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {SUPPORTED_CORNER_SQUARE_TYPES.map((shape) => {
                  const active = config.cornersSquare.type === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.cornersSquare.type = shape;
                        })
                      }
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <EyeFrameGlyph type={shape} active={active} />
                      <span>{EYE_FRAME_LABELS[shape]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="block text-xs font-semibold text-slate-800">
                Finder Eye Pupil
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {SUPPORTED_CORNER_DOT_TYPES.map((shape) => {
                  const active = config.cornersDot.type === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.cornersDot.type = shape;
                        })
                      }
                      className={`flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <EyePupilGlyph type={shape} active={active} />
                      <span>{EYE_PUPIL_LABELS[shape]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet Zone Quick Margin (Standard) + Fine Slider (Advanced) */}
            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Quiet Zone Breathing Room</span>
                <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                  {config.quietZonePx}px
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {QUIET_ZONE_PRESETS.map((preset) => {
                  const active = config.quietZonePx === preset.px;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.quietZonePx = preset.px;
                        })
                      }
                      className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-semibold">{preset.label}</div>
                      <div className="font-mono text-[10px] text-slate-500 tabular-nums">
                        {preset.px}px
                      </div>
                    </button>
                  );
                })}
              </div>

              {isAdvanced && (
                <div>
                  <label htmlFor="quiet-zone-slider" className="sr-only">
                    Exact Quiet Zone Margin
                  </label>
                  <input
                    id="quiet-zone-slider"
                    type="range"
                    min={0}
                    max={48}
                    step={2}
                    value={config.quietZonePx}
                    onChange={(e) =>
                      updateDesign((d) => {
                        d.quietZonePx = Number(e.target.value);
                      })
                    }
                    className="w-full accent-teal-700"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Keep at least 16–20px so camera scanners isolate finder corners reliably.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="block text-xs font-semibold text-slate-800">
                Error Correction Level
              </span>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {ERROR_CORRECTION_LEVELS.map((lvl) => {
                  const active = config.errorCorrectionLevel === lvl;
                  const pct = lvl === 'L' ? '7%' : lvl === 'M' ? '15%' : lvl === 'Q' ? '25%' : '30%';
                  return (
                    <button
                      key={lvl}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.errorCorrectionLevel = lvl as ErrorCorrectionLevel;
                        })
                      }
                      className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl}</div>
                      <div className="font-mono text-[10px] text-slate-500 tabular-nums">{pct}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Use Q or H when embedding a center logo; lower levels keep modules larger for long URLs.
              </p>
            </div>

            {isAdvanced && (
              <div className="border-t border-slate-200 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Portable Style Config (JSON)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyStyleJson()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    {copiedStyle ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Copied JSON</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Style JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonError(null);
                      if (!jsonImportOpen) {
                        setJsonDraft(serializeDesignConfig(config));
                      }
                      setJsonImportOpen((v) => !v);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{jsonImportOpen ? 'Close Import' : 'Import JSON'}</span>
                  </button>
                </div>

                {jsonImportOpen && (
                  <div className="space-y-2">
                    <textarea
                      aria-label="Design configuration JSON"
                      rows={4}
                      value={jsonDraft}
                      onChange={(e) => setJsonDraft(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-[11px] text-slate-800 focus:border-teal-700 focus:bg-white focus:outline-none"
                    />
                    {jsonError && (
                      <p role="alert" className="text-[11px] font-medium text-red-700">
                        {jsonError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleApplyStyleJson}
                      className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Apply Style JSON
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'colors' && (
          <>
            {/* Quick 1-Click Color Harmonies */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                  <span>Quick Harmonies</span>
                </span>
                <button
                  type="button"
                  onClick={handleSwapColors}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  <span>Swap Ink / Bg</span>
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {COLOR_HARMONIES.map((pal) => (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() =>
                      updateDesign((d) => {
                        d.dots.fill = { mode: 'solid', color: pal.ink };
                        d.cornersSquare.useCustomColor = true;
                        d.cornersSquare.color = pal.eye;
                        d.cornersDot.useCustomColor = true;
                        d.cornersDot.color = pal.ink;
                        d.background.transparent = false;
                        d.background.color = pal.bg;
                        d.frame.frameColor = pal.bg;
                        d.frame.accentColor = pal.accent;
                        if (d.frame.style !== 'scan-pill' && d.frame.captionStyle !== 'pill') {
                          d.frame.captionColor = pal.ink;
                        }
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-left transition-colors hover:border-teal-700"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-sm border border-black/10"
                        style={{ backgroundColor: pal.ink }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-sm border border-black/10"
                        style={{ backgroundColor: pal.eye }}
                      />
                      <span
                        className="h-3.5 w-3.5 rounded-sm border border-slate-300"
                        style={{ backgroundColor: pal.bg }}
                      />
                    </div>
                    <div className="mt-1 truncate text-[10px] font-medium text-slate-700">
                      {pal.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="block text-xs font-semibold text-slate-800">
                Module Fill Mode
              </span>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'solid', label: 'Solid' },
                    { id: 'linear', label: 'Linear' },
                    { id: 'radial', label: 'Radial' },
                  ] as const
                ).map((m) => {
                  const active =
                    m.id === 'solid'
                      ? config.dots.fill.mode === 'solid'
                      : config.dots.fill.mode === 'gradient' &&
                        config.dots.fill.gradient.type === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          if (m.id === 'solid') {
                            d.dots.fill = { mode: 'solid', color: solidColor };
                          } else {
                            const existingStops =
                              d.dots.fill.mode === 'gradient'
                                ? d.dots.fill.gradient.stops
                                : [
                                    { offset: 0, color: solidColor },
                                    { offset: 1, color: '#0F766E' },
                                  ];
                            d.dots.fill = {
                              mode: 'gradient',
                              gradient: {
                                type: m.id as GradientType,
                                rotationDeg:
                                  d.dots.fill.mode === 'gradient'
                                    ? d.dots.fill.gradient.rotationDeg
                                    : 135,
                                stops: existingStops,
                              },
                            };
                          }
                        })
                      }
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {config.dots.fill.mode === 'solid' ? (
                <div className="mt-3">
                  <ColorInputRow
                    id="dots-solid-color"
                    label="Module Ink"
                    value={config.dots.fill.color}
                    onChange={(hex) =>
                      updateDesign((d) => {
                        d.dots.fill = { mode: 'solid', color: hex };
                      })
                    }
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {config.dots.fill.gradient.stops.map((stop, index) => {
                    const isThird = index === 1 && config.dots.fill.mode === 'gradient' && config.dots.fill.gradient.stops.length === 3;
                    const stopLabel =
                      index === 0
                        ? 'Gradient Start'
                        : isThird
                        ? 'Midpoint Stop'
                        : 'Gradient End';
                    return (
                      <ColorInputRow
                        key={`grad-stop-${index}`}
                        id={`grad-stop-${index}`}
                        label={stopLabel}
                        value={stop.color}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            if (d.dots.fill.mode === 'gradient' && d.dots.fill.gradient.stops[index]) {
                              d.dots.fill.gradient.stops[index].color = hex;
                            }
                          })
                        }
                      />
                    );
                  })}

                  {isAdvanced && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateDesign((d) => {
                            if (d.dots.fill.mode !== 'gradient') return;
                            const colors = d.dots.fill.gradient.stops.map((s) => s.color).reverse();
                            d.dots.fill.gradient.stops.forEach((s, idx) => {
                              s.color = colors[idx];
                            });
                          })
                        }
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>Reverse Stops</span>
                      </button>

                      {config.dots.fill.gradient.stops.length < 3 ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateDesign((d) => {
                              if (d.dots.fill.mode !== 'gradient' || d.dots.fill.gradient.stops.length >= 3) {
                                return;
                              }
                              const s0 = d.dots.fill.gradient.stops[0];
                              const s1 = d.dots.fill.gradient.stops[1];
                              d.dots.fill.gradient.stops = [
                                { offset: 0, color: s0.color },
                                { offset: 0.5, color: '#0369A1' },
                                { offset: 1, color: s1.color },
                              ];
                            })
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" />
                          <span>3rd Stop</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateDesign((d) => {
                              if (d.dots.fill.mode !== 'gradient' || d.dots.fill.gradient.stops.length < 3) {
                                return;
                              }
                              const first = d.dots.fill.gradient.stops[0];
                              const last = d.dots.fill.gradient.stops[d.dots.fill.gradient.stops.length - 1];
                              d.dots.fill.gradient.stops = [
                                { offset: 0, color: first.color },
                                { offset: 1, color: last.color },
                              ];
                            })
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove Midpoint</span>
                        </button>
                      )}
                    </div>
                  )}

                  {config.dots.fill.gradient.type === 'linear' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="grad-angle" className="font-medium text-slate-700">
                          Gradient Direction
                        </label>
                        <span className="font-mono text-xs text-slate-700 tabular-nums">
                          {config.dots.fill.gradient.rotationDeg}°
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[0, 45, 90, 135, 180].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() =>
                              updateDesign((d) => {
                                if (d.dots.fill.mode === 'gradient') {
                                  d.dots.fill.gradient.rotationDeg = deg;
                                }
                              })
                            }
                            className={`rounded border py-1 font-mono text-[10px] tabular-nums ${
                              config.dots.fill.mode === 'gradient' &&
                              config.dots.fill.gradient.rotationDeg === deg
                                ? 'border-teal-700 bg-teal-50 text-teal-900 font-semibold'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
                      </div>
                      {isAdvanced && (
                        <input
                          id="grad-angle"
                          type="range"
                          min={0}
                          max={360}
                          step={5}
                          value={config.dots.fill.gradient.rotationDeg}
                          onChange={(e) =>
                            updateDesign((d) => {
                              if (d.dots.fill.mode === 'gradient') {
                                d.dots.fill.gradient.rotationDeg = Number(e.target.value);
                              }
                            })
                          }
                          className="w-full accent-teal-700"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-xs font-semibold text-slate-800">
                  Finder Eye Colors
                </span>
                {!isAdvanced && (
                  <button
                    type="button"
                    onClick={() =>
                      updateDesign((d) => {
                        const next = !(d.cornersSquare.useCustomColor || d.cornersDot.useCustomColor);
                        d.cornersSquare.useCustomColor = next;
                        d.cornersDot.useCustomColor = next;
                      })
                    }
                    className="text-[11px] font-medium text-teal-700 hover:underline"
                  >
                    {config.cornersSquare.useCustomColor ? 'Sync with Modules' : 'Customize Eyes'}
                  </button>
                )}
              </div>

              {isAdvanced ? (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.cornersSquare.useCustomColor}
                        onChange={(e) =>
                          updateDesign((d) => {
                            d.cornersSquare.useCustomColor = e.target.checked;
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-teal-700"
                      />
                      <span>Custom Finder Frame Color (unchecked inherits module fill)</span>
                    </label>
                    {config.cornersSquare.useCustomColor && (
                      <ColorInputRow
                        id="eye-frame-color"
                        label="Finder Frame"
                        value={config.cornersSquare.color}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            d.cornersSquare.color = hex;
                          })
                        }
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.cornersDot.useCustomColor}
                        onChange={(e) =>
                          updateDesign((d) => {
                            d.cornersDot.useCustomColor = e.target.checked;
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-teal-700"
                      />
                      <span>Custom Finder Pupil Color</span>
                    </label>
                    {config.cornersDot.useCustomColor && (
                      <ColorInputRow
                        id="eye-pupil-color"
                        label="Finder Pupil"
                        value={config.cornersDot.color}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            d.cornersDot.color = hex;
                          })
                        }
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2.5">
                  {config.cornersSquare.useCustomColor ? (
                    <>
                      <ColorInputRow
                        id="eye-frame-color"
                        label="Finder Frame"
                        value={config.cornersSquare.color}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            d.cornersSquare.useCustomColor = true;
                            d.cornersSquare.color = hex;
                          })
                        }
                      />
                      <ColorInputRow
                        id="eye-pupil-color"
                        label="Finder Pupil"
                        value={config.cornersDot.color}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            d.cornersDot.useCustomColor = true;
                            d.cornersDot.color = hex;
                          })
                        }
                      />
                    </>
                  ) : (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                      Finder eyes automatically inherit your module color or gradient.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <span className="block text-xs font-semibold text-slate-800">
                QR Background
              </span>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.background.transparent}
                  onChange={(e) =>
                    updateDesign((d) => {
                      d.background.transparent = e.target.checked;
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-teal-700"
                />
                <span>Transparent QR Background</span>
              </label>

              {!config.background.transparent && (
                <ColorInputRow
                  id="qr-bg-color"
                  label="Background Color"
                  value={config.background.color}
                  onChange={(hex) =>
                    updateDesign((d) => {
                      d.background.color = hex;
                    })
                  }
                />
              )}

              {isAdvanced && (
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="bg-corner-radius" className="font-medium text-slate-700">
                      Inner Matrix Radius
                    </label>
                    <span className="font-mono text-xs text-slate-700 tabular-nums">
                      {config.background.cornerRadius}px
                    </span>
                  </div>
                  <input
                    id="bg-corner-radius"
                    type="range"
                    min={0}
                    max={24}
                    step={2}
                    value={config.background.cornerRadius}
                    onChange={(e) =>
                      updateDesign((d) => {
                        d.background.cornerRadius = Number(e.target.value);
                      })
                    }
                    className="mt-1 w-full accent-teal-700"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'frame' && (
          <>
            <div>
              <span className="block text-xs font-semibold text-slate-800">
                Frame &amp; Card Layout
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {FRAME_STYLES.map((style) => {
                  const active = config.frame.style === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        updateDesign((d) => {
                          d.frame.style = style;
                          if (style !== 'none' && d.frame.borderWidth === 0) {
                            d.frame.borderWidth = 1;
                          }
                          if (style === 'scan-pill') {
                            d.frame.captionStyle = 'pill';
                            if (!d.frame.caption.trim()) {
                              d.frame.caption = 'Scan Me';
                              d.frame.captionColor = '#FFFFFF';
                            }
                          }
                          if ((style === 'ticket' || style === 'polaroid') && !d.frame.caption.trim()) {
                            d.frame.caption = style === 'ticket' ? 'Admit One' : 'Scan to View';
                          }
                        })
                      }
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'border-teal-700 bg-teal-50/60 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <FrameStyleGlyph style={style} active={active} />
                      <span className="leading-tight">{FRAME_LABELS[style]}</span>
                    </button>
                  );
                })}
              </div>

              {config.frame.style !== 'none' && (
                <div className="mt-3.5 space-y-3">
                  <ColorInputRow
                    id="frame-bg-color"
                    label="Frame Surface"
                    value={config.frame.frameColor}
                    onChange={(hex) =>
                      updateDesign((d) => {
                        d.frame.frameColor = hex;
                      })
                    }
                  />
                  <ColorInputRow
                    id="frame-accent-color"
                    label="Frame Accent"
                    value={config.frame.accentColor}
                    onChange={(hex) =>
                      updateDesign((d) => {
                        d.frame.accentColor = hex;
                      })
                    }
                  />

                  {isAdvanced && (
                    <>
                      <ColorInputRow
                        id="frame-border-color"
                        label="Border Color"
                        value={config.frame.borderColor}
                        onChange={(hex) =>
                          updateDesign((d) => {
                            d.frame.borderColor = hex;
                          })
                        }
                      />

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={config.frame.shadowEnabled}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.frame.shadowEnabled = e.target.checked;
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-teal-700"
                        />
                        <span>Soft Card Elevation Shadow</span>
                      </label>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="frame-border-width" className="font-medium text-slate-700">
                            Border Thickness
                          </label>
                          <span className="font-mono text-xs tabular-nums">
                            {config.frame.borderWidth}px
                          </span>
                        </div>
                        <input
                          id="frame-border-width"
                          type="range"
                          min={0}
                          max={12}
                          step={1}
                          value={config.frame.borderWidth}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.frame.borderWidth = Number(e.target.value);
                            })
                          }
                          className="mt-1 w-full accent-teal-700"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <label htmlFor="frame-border-radius" className="font-medium text-slate-700">
                            Card Corner Radius
                          </label>
                          <span className="font-mono text-xs tabular-nums">
                            {config.frame.borderRadius}px
                          </span>
                        </div>
                        <input
                          id="frame-border-radius"
                          type="range"
                          min={0}
                          max={36}
                          step={2}
                          value={config.frame.borderRadius}
                          onChange={(e) =>
                            updateDesign((d) => {
                              d.frame.borderRadius = Number(e.target.value);
                            })
                          }
                          className="mt-1 w-full accent-teal-700"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="frame-caption-input" className="block text-xs font-semibold text-slate-800">
                    Call-to-Action Caption
                  </label>
                  {config.frame.caption && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDesign((d) => {
                          d.frame.caption = '';
                        })
                      }
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="frame-caption-input"
                  type="text"
                  maxLength={48}
                  value={config.frame.caption}
                  onChange={(e) =>
                    updateDesign((d) => {
                      d.frame.caption = e.target.value;
                    })
                  }
                  placeholder="e.g. Scan for Menu or Wi-Fi"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {CAPTION_PRESETS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() =>
                        updateDesign((d) => {
                          d.frame.caption = text;
                          if (d.frame.style === 'none') {
                            d.frame.style = 'card';
                            d.frame.borderWidth = 1;
                          }
                        })
                      }
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                        config.frame.caption === text
                          ? 'border-teal-700 bg-teal-50 text-teal-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {config.frame.caption.trim().length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700">Caption Position</span>
                    <div className="flex rounded-lg bg-slate-100 p-0.5">
                      {(['bottom', 'top'] as CaptionPosition[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() =>
                            updateDesign((d) => {
                              d.frame.captionPosition = pos;
                            })
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                            config.frame.captionPosition === pos
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          {pos === 'bottom' ? 'Bottom' : 'Top'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ColorInputRow
                    id="frame-caption-color"
                    label="Caption Ink"
                    value={config.frame.captionColor}
                    onChange={(hex) =>
                      updateDesign((d) => {
                        d.frame.captionColor = hex;
                      })
                    }
                  />

                  {isAdvanced && (
                    <>
                      <div>
                        <span className="block text-xs font-medium text-slate-700">
                          Caption Style
                        </span>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                          {CAPTION_STYLES.map((st) => (
                            <button
                              key={st}
                              type="button"
                              aria-pressed={config.frame.captionStyle === st}
                              onClick={() =>
                                updateDesign((d) => {
                                  d.frame.captionStyle = st as CaptionStyle;
                                  if (st === 'pill' && d.frame.captionColor === '#0F172A') {
                                    d.frame.captionColor = '#FFFFFF';
                                  }
                                })
                              }
                              className={`rounded-md border px-2 py-1.5 text-[11px] font-medium capitalize ${
                                config.frame.captionStyle === st
                                  ? 'border-teal-700 bg-teal-50/70 text-teal-900'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-xs font-medium text-slate-700">
                          Caption Font
                        </span>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                          {CAPTION_FONTS.map((f) => (
                            <button
                              key={f}
                              type="button"
                              aria-pressed={config.frame.captionFont === f}
                              onClick={() =>
                                updateDesign((d) => {
                                  d.frame.captionFont = f as CaptionFont;
                                })
                              }
                              className={`rounded-md border px-2 py-1.5 text-[11px] font-medium capitalize ${
                                config.frame.captionFont === f
                                  ? 'border-teal-700 bg-teal-50/70 text-teal-900'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            >
                              {f === 'sans' ? 'Sans' : f === 'serif' ? 'Serif' : 'Mono'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
