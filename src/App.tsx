import { useState } from 'react';
import { StudioHeader } from './components/layout/StudioHeader';
import { PrivacyModal } from './components/layout/PrivacyModal';
import { ContentBuilderPanel } from './features/content/components/ContentBuilderPanel';
import { BrandDnaPanel } from './features/brand-dna/components/BrandDnaPanel';
import { PresetsPanel } from './features/editor/panels/PresetsPanel';
import { DesignInspector } from './features/editor/panels/DesignInspector';
import { LiveCanvasStage } from './features/editor/components/LiveCanvasStage';
import { ExportModal } from './features/export/components/ExportModal';
import { useAtelierStore } from './features/editor/state/useAtelierStore';

type LeftTab = 'content' | 'brand' | 'presets';
type MobileView = 'preview' | 'content' | 'brand' | 'presets' | 'design';

export default function App() {
  const [leftTab, setLeftTab] = useState<LeftTab>('content');
  const [mobileView, setMobileView] = useState<MobileView>('preview');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const payloadValid = useAtelierStore((s) => s.payloadResult.valid);

  const handleNavigateSection = (section: 'content' | 'presets' | 'brand') => {
    if (section === 'content') {
      setLeftTab('content');
      setMobileView('content');
    } else if (section === 'presets') {
      setLeftTab('presets');
      setMobileView('presets');
    } else if (section === 'brand') {
      setLeftTab('brand');
      setMobileView('brand');
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F5F6F8] text-slate-900">
      <StudioHeader
        onNavigateSection={handleNavigateSection}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        canExport={payloadValid}
      />

      {/* Mobile Section Switcher (<= lg) */}
      <div className="border-b border-slate-200 bg-white px-2.5 py-2 lg:hidden">
        <div
          role="tablist"
          aria-label="Mobile studio panels"
          className="grid grid-cols-5 gap-1"
        >
          {(
            [
              { id: 'preview', label: 'Preview' },
              { id: 'content', label: 'Content' },
              { id: 'brand', label: 'Brand' },
              { id: 'presets', label: 'Presets' },
              { id: 'design', label: 'Design' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mobileView === item.id}
              onClick={() => setMobileView(item.id)}
              className={`rounded-lg px-1.5 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap text-center ${
                mobileView === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_340px] gap-5 items-start">
          {/* Left Panel: Content / Brand DNA / Presets */}
          <aside
            aria-label="Content, Brand DNA, and Presets"
            className={`rounded-xl border border-slate-200 bg-white overflow-hidden lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-96px)] lg:flex lg:flex-col ${
              mobileView === 'content' || mobileView === 'brand' || mobileView === 'presets'
                ? 'block'
                : 'hidden lg:flex'
            }`}
          >
            <div className="hidden lg:block border-b border-slate-200 px-4 pt-3 pb-2.5">
              <div
                role="tablist"
                aria-label="Source and branding tabs"
                className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: 'content', label: 'Content' },
                    { id: 'brand', label: 'Brand DNA' },
                    { id: 'presets', label: 'Presets' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={leftTab === t.id}
                    onClick={() => setLeftTab(t.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      leftTab === t.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Desktop uses leftTab; mobile uses mobileView */}
              <div className="hidden lg:block">
                {leftTab === 'content' && <ContentBuilderPanel />}
                {leftTab === 'brand' && <BrandDnaPanel />}
                {leftTab === 'presets' && <PresetsPanel />}
              </div>
              <div className="lg:hidden">
                {mobileView === 'content' && <ContentBuilderPanel />}
                {mobileView === 'brand' && <BrandDnaPanel />}
                {mobileView === 'presets' && <PresetsPanel />}
              </div>
            </div>
          </aside>

          {/* Center Artboard: Live Preview + Scan Guard */}
          <section
            aria-label="Live QR preview and Scan Guard"
            className={`${mobileView === 'preview' ? 'block' : 'hidden lg:block'}`}
          >
            <LiveCanvasStage />
          </section>

          {/* Right Panel: Design Inspector */}
          <aside
            aria-label="Design inspector controls"
            className={`rounded-xl border border-slate-200 bg-white overflow-hidden lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-96px)] lg:flex lg:flex-col ${
              mobileView === 'design' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <DesignInspector />
          </aside>
        </div>
      </main>

      {/* Quiet Local-First Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <span>QR Atelier · Static QR studio processed locally in your browser</span>
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
          >
            Local-first privacy &amp; static code notes
          </button>
        </div>
      </footer>

      <ExportModal open={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <PrivacyModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
}
