# QR Atelier — Product Requirements & Engineering Specification

**Version:** 1.0  
**Date:** 13 November 2026  
**Status:** Initial development specification  
**Product type:** Free, browser-first QR code design studio  
**Recommended framework:** React + TypeScript + Vite

---

## 1. Executive summary

**QR Atelier** is a free, brand-first QR code design studio. It turns QR generation from a simple utility into a lightweight creative application. Users can generate static QR codes, upload a logo, extract a brand palette, customize individual QR components, validate scan reliability, and export polished assets without subscriptions, watermarks, or mandatory accounts.

**Product promise:** Your brand. Your style. Your QR.

The differentiator is not merely the presence of a logo or color picker. It is the combination of:
1. Logo-aware brand palette suggestions.
2. Fine-grained visual control over supported QR components.
3. A live design editor.
4. Automated QR decoding and design-risk checks.
5. Local-first privacy and offline-capable workflows.
6. Useful export and batch-generation tools, available without paywalls.

No product can honestly promise to be “100% better than every competitor.” QR Atelier should instead compete on measurable quality, usability, breadth of free functionality, and reliability.

## 2. Product principles

- **Free-first:** No subscription gates for core design, export, logo, templates, or validation.
- **Static by default:** Initial release generates static QR codes; it does not promise editable destinations after printing.
- **Local-first:** QR payloads, logos, and projects stay in the browser unless a user explicitly exports or shares them.
- **Scan reliability before decoration:** A visually attractive code must still decode to the exact original payload.
- **Creative control:** Presets are starting points, not locked templates.
- **Honest validation:** A successful software decode is not a guarantee that every phone can scan the code in every condition.
- **Accessible and responsive:** Keyboard-accessible controls, clear labels, and mobile-friendly layouts.

## 3. Target users and jobs to be done

### Primary users
- Small businesses and local shops.
- Restaurants and cafés.
- Creators, freelancers, and personal brands.
- Event organizers and schools.
- Designers and marketing teams.
- Individuals creating Wi-Fi, contact, or location QR codes.

### User needs
- “I want my QR code to match my logo and brand.”
- “I want to change the dots, corner eyes, colors, and logo separately.”
- “I want to know whether the design still scans.”
- “I need a high-quality file for print and digital use.”
- “I don't want to create an account or pay to remove a watermark.”

## 4. Scope

### MVP — must ship
1. Generate static QR codes for URL, plain text, Wi-Fi, email, phone, SMS, and vCard/contact.
2. Live preview with independent styling controls.
3. Dot/module styles and supported finder-eye / pupil styles.
4. Solid colors and gradients.
5. Logo upload, sizing, padding, shape/backdrop controls.
6. Background, quiet-zone, border, and caption controls.
7. Curated editable design presets.
8. PNG and SVG export.
9. QR decode verification against the original payload.
10. Clear scan-risk warnings and safe defaults.
11. Responsive editor UI.
12. No account, no watermark, no artificial generation quota.

### Post-MVP
- Brand kits and saved local projects.
- Undo/redo and version history.
- JPG, WebP, PDF and print layouts.
- CSV bulk generation and ZIP export.
- QR image upload, decode, and recreation from its payload.
- Offline PWA support.
- Additional mockups and advanced composition tools.

### Explicitly out of initial scope
- Dynamic QR redirects and destination editing after printing.
- Hosted landing pages, analytics, link tracking, or user accounts.
- Cloud storage and collaboration.
- Claims of universal device compatibility.

## 5. Core user journey

1. User selects a QR content type.
2. User enters and validates the content.
3. User optionally uploads a logo.
4. Brand DNA extracts dominant colors and proposes palettes.
5. User chooses a suggested design or starts from a preset.
6. User customizes QR modules, eyes, colors, gradients, logo, background, frame, and caption.
7. The editor renders a live preview.
8. Scan Guard checks the rendered output and compares decoded content with the original payload.
9. User reviews warnings and optionally applies safe fixes.
10. User exports PNG or SVG.

## 6. Functional requirements

### FR-01: QR content builder
- Support URL, text, Wi-Fi, email, phone, SMS, and vCard/contact payloads.
- Validate required fields and encode content according to the relevant format.
- Preserve the exact payload used for generation.
- Show a readable summary before generation.
- Never silently rewrite a destination URL.

### FR-02: Live QR renderer
- Render from a single typed design configuration.
- Update the preview when supported settings change.
- Debounce expensive rendering operations where appropriate.
- Keep the QR payload separate from visual styling state.
- Provide a reset-to-preset and reset-to-default action.

### FR-03: Design controls
- Module shape: only shapes supported by the chosen rendering engine.
- Finder-eye frame and pupil styles: supported variants.
- Foreground and background colors.
- Gradient type, direction, and color stops where supported.
- Independent colors for supported components.
- Border, frame, caption, and quiet-zone controls.
- Provide safe defaults with strong contrast.

### FR-04: Logo and Brand DNA
- Accept common image formats such as PNG, JPEG, and WebP; support SVG only after sanitization.
- Extract dominant colors locally in the browser.
- Suggest multiple palettes, including brand-dominant, complementary, monochrome, and high-contrast options.
- Allow users to override all suggested colors.
- Provide logo sizing, fit, padding, backdrop, shape, and border controls.
- Keep logo placement within a conservative safe area.
- Never imply that error correction makes arbitrary logo coverage safe.

### FR-05: Scan Guard
- Decode the final rendered raster output with an independent decoder.
- Compare decoded payload with the exact expected payload.
- Check that a quiet zone is present.
- Flag weak contrast, excessive logo coverage, low output resolution, and dense codes.
- Preserve essential finder patterns and timing/alignment structures.
- Provide actionable warnings and conservative auto-fixes.
- Distinguish “decoded successfully” from “tested on physical devices.”

### FR-06: Presets
- Provide professionally designed presets: Minimal, Corporate, Luxury, Gradient, Nature, Playful, Monochrome, and Technology.
- Presets must populate editable controls; they must not lock the design.
- Include a plain, high-contrast preset for maximum compatibility.

### FR-07: Export
- MVP: PNG and SVG.
- Preserve exact payload and visual settings during export.
- Offer transparent background only when supported and safe.
- Provide size controls and a preview of the exported asset.
- Verify exported raster output, not only the editor preview.
- Do not add watermarks or impose export quotas.

### FR-08: Local projects
- Post-MVP: save projects and brand kits in IndexedDB.
- Provide rename, duplicate, delete, and export/import project actions.
- Explain that clearing browser data may remove locally saved projects.

### FR-09: Bulk generation
- Post-MVP: import CSV, map a content column, generate a set with a shared style, and export a ZIP.
- Validate each row and report failures without discarding successful results.
- Avoid a server dependency for ordinary batch generation.

## 7. Non-functional requirements

- **Performance:** Common edits should feel immediate; avoid unnecessary full-app rerenders.
- **Reliability:** Exported content must decode to the exact payload.
- **Privacy:** No payload or logo upload to a server in the MVP.
- **Security:** Sanitize SVG input; avoid injecting user-provided markup into the DOM.
- **Accessibility:** Keyboard-operable controls, visible focus, labels, contrast, and status announcements.
- **Responsive:** Desktop-first editor with a usable mobile layout.
- **Maintainability:** Strict TypeScript, modular feature boundaries, typed design configuration.
- **Compatibility:** Test current major desktop browsers and representative mobile browsers.
- **Offline:** PWA support is post-MVP; the core architecture should not prevent it.

## 8. Recommended framework and technology stack

### Framework decision: React + TypeScript + Vite

Choose **React** in the provided framework selector.

Why:
- QR Atelier is primarily a client-side interactive editor.
- It does not need server-side rendering for QR generation.
- Vite offers a simple, fast development server and static production build.
- React component state and composition suit a multi-panel design editor.
- A static deployment keeps infrastructure and operating costs low.
- PWA support can be added with a service worker.

### Suggested stack

| Area | Recommendation | Responsibility |
|---|---|---|
| Framework | React | UI and editor |
| Language | TypeScript | Type safety |
| Build tool | Vite | Development and static build |
| Styling | Tailwind CSS | Layout and visual system |
| Components | shadcn/ui + Radix primitives | Accessible controls |
| Icons | Lucide | Consistent iconography |
| State | Zustand | Editor state and history |
| QR rendering | `qr-code-styling` or a verified equivalent | QR generation and styling |
| QR decoding | ZXing Browser | Independent decode verification |
| Image processing | Canvas API | Palette extraction and raster processing |
| Local persistence | IndexedDB (optionally Dexie) | Projects and brand kits |
| Validation | Zod | Runtime validation of user inputs and project data |
| Testing | Vitest + React Testing Library | Unit and component tests |
| Browser E2E | Playwright | End-to-end and browser workflows |
| PDF | pdf-lib | Post-MVP print export |
| Batch archive | JSZip | Post-MVP ZIP export |
| PWA | Vite PWA plugin | Offline installation and caching |

**Important library decision:** Before committing to `qr-code-styling`, run a technical spike. Verify that it supports the exact required combinations of dot shapes, independent eye styling, gradients, logos, SVG/PNG export, and the error-correction controls needed by the product. Build an adapter around the library so it can be replaced without rewriting the editor.

### Why not Next.js?
Next.js is a capable React framework, but its server rendering and server features are not necessary for the initial browser-only QR studio. Choose it later if server-rendered marketing pages, hosted dynamic QR services, authentication, or server APIs become real requirements. Do not add a backend merely because a framework makes one available.

## 9. High-level architecture

```text
React Application
├── Content Builder
│   ├── Content Type Forms
│   ├── Payload Formatter
│   └── Payload Validator
├── Brand DNA
│   ├── Logo Import
│   ├── Image Sanitization
│   ├── Palette Extraction
│   └── Palette Suggestions
├── Design Studio
│   ├── Live Canvas
│   ├── Module Controls
│   ├── Finder Pattern Controls
│   ├── Color and Gradient Controls
│   ├── Logo Controls
│   └── Frame and Caption Controls
├── QR Engine Adapter
│   ├── QR Matrix / Renderer
│   └── Export Renderer
├── Scan Guard
│   ├── Rasterize Final Output
│   ├── Independent Decode
│   ├── Payload Comparison
│   └── Risk Warnings
├── Export Manager
│   ├── PNG
│   └── SVG
└── Local Data
    └── IndexedDB (post-MVP projects)
```

### Architectural rules
- Keep `payload` and `designConfig` as separate models.
- The renderer receives a validated payload and a typed design configuration.
- All rendering libraries are accessed through a QR Engine Adapter.
- Scan Guard tests the actual exported/rendered artifact.
- No UI component should directly manipulate QR library internals.
- Use deterministic design configurations so projects can be reopened consistently.

## 10. Suggested project structure

```text
src/
  app/
    App.tsx
    routes/
  components/
    ui/
    layout/
  features/
    content/
      components/
      schemas/
      payload-builders/
    brand-dna/
      components/
      palette/
      image-processing/
    editor/
      components/
      panels/
      presets/
      state/
      history/
    qr-engine/
      adapter/
      renderer/
      types/
    scan-guard/
      decoder/
      checks/
      reports/
    export/
      png/
      svg/
  lib/
    validation/
    image/
    utils/
  storage/
    indexed-db/
  styles/
  tests/
```

## 11. SDD — Specification-Driven Development tasks

SDD means the team defines and reviews the intended behavior and interfaces before implementation. The specification is the source of truth; implementation and tests must trace back to it.

### SDD-00: Establish product scope
- [ ] Confirm MVP and post-MVP boundaries.
- [ ] Define target users and core journey.
- [ ] Record explicit non-goals: dynamic redirects, analytics, cloud accounts.
- [ ] Define free-first product rules.
- **Deliverable:** Approved product requirements document.

### SDD-01: Define user stories and acceptance criteria
- [ ] Write user stories for each MVP feature.
- [ ] Define normal, invalid, and edge-case behavior.
- [ ] Define empty, loading, success, and error states.
- [ ] Define keyboard and mobile behavior.
- **Deliverable:** User story and acceptance-criteria catalogue.

### SDD-02: Design the UX and design system
- [ ] Define editor navigation and panel hierarchy.
- [ ] Specify content creation flow.
- [ ] Specify desktop and mobile layouts.
- [ ] Define spacing, typography, colors, controls, and focus states.
- [ ] Design warning and validation states.
- **Deliverable:** Wireframes and UI specification.

### SDD-03: Define domain models and contracts
- [ ] Define `QrPayload` types.
- [ ] Define `DesignConfig` schema.
- [ ] Define `BrandPalette` schema.
- [ ] Define `ScanReport` and warning codes.
- [ ] Define export request/result types.
- [ ] Define project serialization/versioning.
- **Deliverable:** Typed domain contracts and schema documentation.

### SDD-04: Technical spike and architecture decision
- [ ] Compare QR rendering libraries against required features.
- [ ] Prototype dot, eye, gradient, logo, and export combinations.
- [ ] Verify independent decoder compatibility.
- [ ] Test SVG safety and sanitization approach.
- [ ] Record decisions and limitations.
- **Deliverable:** Architecture Decision Records (ADRs) and working spike.

### SDD-05: Define validation and safety policy
- [ ] Define quiet-zone handling.
- [ ] Define conservative logo size and placement rules.
- [ ] Define contrast warning thresholds and limitations.
- [ ] Define export decode-verification behavior.
- [ ] Define what “passed” means and what it does not guarantee.
- **Deliverable:** Scan Guard specification.

### SDD-06: Break down implementation
- [ ] Split requirements into vertical, testable stories.
- [ ] Identify dependencies and milestones.
- [ ] Link each story to acceptance criteria and tests.
- [ ] Define code review and definition-of-done rules.
- **Deliverable:** Prioritized implementation backlog.

## 12. TDD — Test-Driven Development tasks

TDD means writing a failing test first, implementing the smallest change to pass, then refactoring while keeping tests green. Use the cycle: **Red → Green → Refactor**.

### TDD-00: Test foundation
- [ ] Configure Vitest.
- [ ] Configure React Testing Library and user-event.
- [ ] Configure Playwright.
- [ ] Add test scripts and CI checks.
- [ ] Create deterministic fixtures and test payloads.
- **Deliverable:** Repeatable test environment.

### TDD-01: Payload builder tests
- [ ] Valid URL and text payloads.
- [ ] Wi-Fi payload escaping and required fields.
- [ ] Email, SMS, phone, and vCard formatting.
- [ ] Unicode and special characters.
- [ ] Invalid or missing inputs.
- **Deliverable:** Unit tests for every content type.

### TDD-02: Design configuration tests
- [ ] Valid defaults.
- [ ] Invalid colors and gradient stops.
- [ ] Unsupported shape values.
- [ ] Logo dimensions and safe-area constraints.
- [ ] Configuration serialization and migration.
- **Deliverable:** Schema and configuration tests.

### TDD-03: QR engine adapter tests
- [ ] Correct payload passed to renderer.
- [ ] Supported design settings mapped correctly.
- [ ] Unsupported settings fail safely or degrade explicitly.
- [ ] PNG and SVG export paths.
- [ ] Deterministic output behavior where feasible.
- **Deliverable:** Adapter contract tests.

### TDD-04: Brand DNA tests
- [ ] Supported image formats.
- [ ] Palette extraction from known fixtures.
- [ ] Transparent logo handling.
- [ ] Empty, corrupt, oversized, and unsupported image handling.
- [ ] Palette suggestions remain editable.
- **Deliverable:** Image and palette tests.

### TDD-05: Scan Guard tests
- [ ] Generated QR decodes to exact original payload.
- [ ] Altered or incorrect payload is rejected.
- [ ] Quiet-zone warning behavior.
- [ ] Logo coverage warning behavior.
- [ ] Low contrast and low-resolution warnings.
- [ ] Decoder failure produces a clear failure report.
- [ ] Physical-device compatibility is never claimed from software decode alone.
- **Deliverable:** Scan Guard unit and integration tests.

### TDD-06: Editor interaction tests
- [ ] Changing a setting updates the preview.
- [ ] Logo upload updates the preview.
- [ ] Preset selection populates editable controls.
- [ ] Undo and redo restore previous state.
- [ ] Reset restores expected defaults.
- [ ] Keyboard controls and accessible labels work.
- **Deliverable:** Component and interaction tests.

### TDD-07: Export tests
- [ ] Exported PNG decodes to exact payload.
- [ ] Exported SVG is valid and safe.
- [ ] Dimensions and margins match settings.
- [ ] No watermark is inserted.
- [ ] Export failure is communicated.
- **Deliverable:** Export integration tests.

### TDD-08: End-to-end acceptance tests
- [ ] Create URL QR, customize it, and export PNG.
- [ ] Upload a logo, apply a palette, and export SVG.
- [ ] Trigger a risky design warning.
- [ ] Apply a safe fix and rerun verification.
- [ ] Test responsive desktop and mobile workflows.
- [ ] Confirm the core flow works without an account.
- **Deliverable:** Playwright E2E suite.

## 13. Development milestones

| Milestone | Work | Exit condition |
|---|---|---|
| M0 — Discovery | SDD, library spike, UX | Scope and architecture approved |
| M1 — Foundation | React/Vite, types, test setup | Build and tests run in CI |
| M2 — QR core | Payloads and QR adapter | Core payloads generate correctly |
| M3 — Editor | Live preview and styling | Main design controls work |
| M4 — Brand | Logo upload and palette extraction | Brand suggestions are editable |
| M5 — Safety | Scan Guard and warnings | Export decodes to exact payload |
| M6 — Export | PNG and SVG | Export acceptance tests pass |
| M7 — Polish | Responsive UI, accessibility, performance | Release checklist passes |
| M8 — Expansion | Projects, PDF, bulk, PWA | Separate post-MVP acceptance |

## 14. Definition of done

A feature is done only when:
- Its specification and acceptance criteria exist.
- Its tests were written before or alongside implementation using TDD.
- Tests pass locally and in CI.
- Invalid input and error states are handled.
- The UI is responsive and accessible.
- No unrelated feature regresses.
- Documentation is updated.
- No hidden paywall, watermark, or artificial quota has been introduced.

For QR generation specifically:
- The expected payload is preserved exactly.
- The exported artifact is decoded independently.
- The decoded result matches the expected payload.
- Warnings are displayed honestly.
- The user can still export a design with a warning only when the product policy explicitly permits it, with the risk clearly communicated.

## 15. Product quality and success metrics

- 100% of supported MVP payload types have unit tests.
- 100% of export acceptance fixtures decode to the expected payload.
- No watermark in any export.
- No account required for core generation.
- No server upload required for core generation.
- Core editing and export work on supported desktop browsers.
- Mobile layout supports the complete basic workflow.
- All core design controls remain available without payment.
- User testing confirms that first-time users can create and export a branded QR code without instructions.

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| QR library lacks a requested shape or export feature | Run a spike; use an adapter; do not promise unsupported controls |
| Attractive design becomes hard to scan | Conservative defaults, independent decoding, warnings, device tests |
| Logo obscures data modules | Restrict safe area and test final output |
| SVG upload introduces unsafe markup | Sanitize or rasterize untrusted SVG before use |
| Large logos or batch jobs slow the UI | Size limits, workers, progress feedback, cancellation |
| Browser storage is cleared | Explain local-only storage; add project export/import |
| “Free forever” becomes financially difficult | Keep core static generation infrastructure-free; optional donations/sponsorship |
| Scope expands too early | Strict MVP and post-MVP boundaries |

## 17. Final implementation recommendation

Select **React** in the framework selector.

Build QR Atelier as a **React + TypeScript + Vite** browser-first application. Start with static QR generation, an editable design configuration, a live editor, logo-aware palettes, and independent scan verification. Keep all core processing local.

Do not start by implementing accounts, analytics, dynamic QR redirects, or a backend. Prove that the design engine and Scan Guard work first.

**First engineering action:** Complete SDD-04, the rendering-library and decoder technical spike, before committing to the final QR engine. The editor's capabilities must be based on verified library behavior, not assumptions.

---

## 18. Reference links

- React: https://react.dev/
- Vite: https://vite.dev/
- TypeScript: https://www.typescriptlang.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Zustand: https://zustand.docs.pmnd.rs/
- qr-code-styling: https://github.com/kozakdenys/qr-code-styling
- ZXing: https://github.com/zxing-js/browser
- Vitest: https://vitest.dev/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Playwright: https://playwright.dev/docs/intro
- Zod: https://zod.dev/
- Dexie: https://dexie.org/
- Vite PWA: https://vite-pwa-org.netlify.app/

**Note:** Verify current package maintenance, licenses, browser support, and exact feature support before selecting dependencies for production.
