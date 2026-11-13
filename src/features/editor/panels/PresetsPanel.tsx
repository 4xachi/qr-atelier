import { useState } from 'react';
import { Award, Check } from 'lucide-react';
import { PresetLayoutThumbnail } from '../components/DesignVisualGlyphs';
import {
  CURATED_PRESETS,
  PRESET_CATEGORIES,
  type DesignPreset,
  type PresetCategory,
} from '../presets/presets';
import { useAtelierStore } from '../state/useAtelierStore';

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  business: 'Business',
  editorial: 'Editorial',
  hospitality: 'Hospitality',
  event: 'Events',
  minimal: 'Minimal',
};

function PresetCard({
  preset,
  isActive,
  onSelect,
  rankNumber,
}: {
  preset: DesignPreset;
  isActive: boolean;
  onSelect: (id: string) => void;
  rankNumber?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset.id)}
      aria-pressed={isActive}
      className={`group flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
        isActive
          ? 'border-teal-700 bg-teal-50/40'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      {rankNumber !== undefined && (
        <span
          aria-label={`Rank ${rankNumber}`}
          className={`w-5 shrink-0 text-center font-mono text-xs font-bold tabular-nums ${
            isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        >
          {String(rankNumber).padStart(2, '0')}
        </span>
      )}

      <div className="shrink-0 rounded-lg border border-slate-200/80 bg-slate-50 p-1">
        <PresetLayoutThumbnail config={preset.config} presetId={preset.id} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-xs font-semibold text-slate-900">
            {preset.name}
          </span>
          {isActive && (
            <Check className="h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          {preset.recommendedReason ? (
            <span className="truncate font-medium text-teal-800">
              {preset.recommendedReason}
            </span>
          ) : (
            <>
              <span>{CATEGORY_LABELS[preset.category]}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {preset.config.frame.style === 'none'
                  ? 'Unframed'
                  : preset.config.frame.caption
                  ? `“${preset.config.frame.caption}”`
                  : preset.config.dots.type}
              </span>
            </>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {preset.tagline}
        </p>
      </div>
    </button>
  );
}

export function PresetsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PresetCategory>('all');
  const activePresetId = useAtelierStore((s) => s.activePresetId);
  const applyPreset = useAtelierStore((s) => s.applyPreset);

  const recommendedPresets = CURATED_PRESETS.filter(
    (p) => typeof p.recommendedRank === 'number'
  ).sort((a, b) => (a.recommendedRank ?? 99) - (b.recommendedRank ?? 99));

  const otherPresets = CURATED_PRESETS.filter(
    (p) => typeof p.recommendedRank !== 'number'
  );

  const filteredCategoryPresets =
    selectedCategory === 'all'
      ? CURATED_PRESETS
      : CURATED_PRESETS.filter((p) => p.category === selectedCategory).sort(
          (a, b) => (a.recommendedRank ?? 99) - (b.recommendedRank ?? 99)
        );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Layout Templates
          </h2>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {filteredCategoryPresets.length}{' '}
            {filteredCategoryPresets.length === 1 ? 'style' : 'styles'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Top-ranked starters and curated styles — every detail remains editable.
        </p>
      </div>

      {/* Category Filter */}
      <div
        role="tablist"
        aria-label="Template categories"
        className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
      >
        {PRESET_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {selectedCategory === 'all' ? (
        <div className="space-y-4">
          {/* Top-Ranked Recommended List */}
          <section aria-label="Recommended top-ranked presets" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Award className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>Recommended Ranking</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Top {recommendedPresets.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {recommendedPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={activePresetId === preset.id}
                  onSelect={applyPreset}
                  rankNumber={preset.recommendedRank}
                />
              ))}
            </div>
          </section>

          {/* Remaining Curated Styles */}
          <section
            aria-label="More curated presets"
            className="space-y-2 border-t border-slate-200 pt-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                More Curated Styles
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {otherPresets.length} styles
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {otherPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isActive={activePresetId === preset.id}
                  onSelect={applyPreset}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredCategoryPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePresetId === preset.id}
              onSelect={applyPreset}
              rankNumber={preset.recommendedRank}
            />
          ))}
        </div>
      )}
    </div>
  );
}
