interface StudioHeaderProps {
  onNavigateSection: (section: 'content' | 'presets' | 'brand') => void;
  onOpenPrivacy: () => void;
  onOpenExport: () => void;
  canExport: boolean;
}

export function StudioHeader({
  onNavigateSection,
  onOpenPrivacy,
  onOpenExport,
  canExport,
}: StudioHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-8 px-4 sm:px-6">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          QR Atelier
        </a>

        <nav
          aria-label="Workspace sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigateSection('content')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('presets')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('brand')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Brand DNA
          </button>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Privacy
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            disabled={!canExport}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap shrink-0"
          >
            Export QR
          </button>
        </div>
      </div>
    </header>
  );
}
