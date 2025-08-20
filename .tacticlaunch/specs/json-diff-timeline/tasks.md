# Implementation Tasks

Convert the design into incremental, test-driven coding steps. Each item includes a TDD-oriented prompt, files to touch, and references to acceptance criteria (R{requirement} AC{criterion}).

1. [x] Project scaffolding and tooling
   - 1.1. [ ] Initialize Next.js App Router (TypeScript), add Tailwind CSS, framer-motion, Zustand, Vitest, React Testing Library, Playwright
     - Prompt: "Scaffold Next.js (App Router, TS). Configure Tailwind, framer-motion, Zustand. Add Vitest+RTL and Playwright with basic configs and npm scripts. Ensure Node 18+."
     - Files: `package.json`, `next.config.js`, `tsconfig.json`, `postcss.config.js`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, test configs
     - Refs: R16 AC1–4

2. [x] Core domain types and state store
   - 2.1. [x] Define TypeScript models (`JsonVersion`, `IgnoreRule`, `TransformRule`, `DiffOptions`, `DiffNode`, `DiffResult`, `AppState`)
     - Prompt: "Create strongly typed domain models per design with exhaustive fields and jsdoc."
     - Files: `src/types/domain.ts`
     - Refs: R12 AC4; R10 AC1–3; R14 AC2–3
   - 2.2. [x] Implement Zustand store with `versions`, `selection`, `options`, `diffCache`, `ui.theme` and selectors
     - Prompt: "Implement Zustand store with strict immutability patterns and derived selectors for active pair and optionsKey."
     - Files: `src/state/store.ts`
     - Refs: R3 AC2–4; R5 AC1–4; R6 AC5
   - 2.3. [x] Unit tests for state transitions (add/reorder/delete versions, option changes, cache invalidation)
     - Prompt: "Write Vitest tests covering add/reorder/delete versions, selection updates, options changes invalidating cache."
     - Files: `src/state/store.test.ts`
     - Refs: R2 AC1–4; R3 AC2–4

3. [x] Diff engine (pure function) with transforms and ignore rules
   - 3.1. [x] Implement `computeJsonDiff(a,b,options)` as a pure function returning `DiffResult`
     - Prompt: "Implement computeJsonDiff using jsondiffpatch, normalize to DiffNode tree with stable paths and stats."
     - Files: `src/engine/diff.ts`
     - Refs: R12 AC1; R4 AC1–3
   - 3.2. [x] Pre-transform pipeline (ignore + transforms) applied symmetrically before diff
     - Prompt: "Implement ignore (keyPath/glob/regex) and transform (round/case/sort/custom) stages with validation and errors surfaced."
     - Files: `src/engine/preprocess.ts`
     - Refs: R7 AC1–3
   - 3.3. [x] Array strategy support: `index` and `keyed` with `arrayKeyPath` and explicit fallback/metadata
     - Prompt: "Add array matching mode keyed by path; default to index; embed strategy in result meta."
     - Files: `src/engine/arrays.ts`
     - Refs: R4 AC3–4
   - 3.4. [x] Unit tests for engine: objects, primitives, arrays (large), rules, determinism
     - Prompt: "Create fixtures and Vitest tests covering adds/deletes/modifies, large arrays (>1000) with virtualization hint, determinism across runs."
     - Files: `src/engine/diff.test.ts`, `fixtures/*.json`
     - Refs: R4 AC1–5; R8 AC1

4. [x] Web Worker integration with Comlink and cancelable queue
   - 4.1. [x] Implement worker exposing `computeJsonDiff` with messaging, cancellation, and queue throttling
     - Prompt: "Create TS worker with Comlink; support job IDs, cancel messages, and queue size limit to avoid memory pressure."
     - Files: `src/worker/diff.worker.ts`, `src/worker/index.ts`
     - Refs: R8 AC2–4
   - 4.2. [x] Worker adapter in UI with promise wrapper and progress events
     - Prompt: "Implement a client adapter emitting start/progress/done for UI; fall back to in-thread compute for tiny inputs."
     - Files: `src/worker/adapter.ts`
     - Refs: R3 AC4; R8 AC2–4
   - 4.3. [x] Tests for worker protocol, cancellation, error propagation
     - Prompt: "Vitest tests using fake timers to assert cancellation and error paths."
     - Files: `src/worker/adapter.test.ts`
     - Refs: R8 AC2–4; R13 AC1

5. [x] Optional server API for large payloads
   - 5.1. [x] Implement `/api/diff` with streaming/chunked results and strict size limits behind env flag
     - Prompt: "Create Next.js route handler that streams JSON ND-JSON chunks; gated by env; HTTPS-only assumption."
     - Files: `app/api/diff/route.ts`
     - Refs: R12 AC2–3; R13 AC2
   - 5.2. [x] Tests for API: size guard, chunking, error responses
     - Prompt: "Write integration tests (Vitest + Next test utils) validating chunked response and guards."
     - Files: `app/api/diff/route.test.ts`
     - Refs: R12 AC2–3; R13 AC2–3

6. [x] UploadPanel (paste/files/URLs), validation, dedupe, labeling, reordering
   - 6.1. [x] Implement component with paste zone, multi-file input, URL fetcher; surface per-input errors
     - Prompt: "Build UploadPanel with controlled inputs, error toasts, and per-source status."
     - Files: `src/components/UploadPanel.tsx`
     - Refs: R1 AC1–4
   - 6.2. [x] Dedupe identical inputs and allow label/timestamp editing, reordering
     - Prompt: "Add dedupe by byte hash; editable label/timestamp; drag-and-drop reorder."
     - Files: `src/components/UploadPanel.tsx`, `src/components/VersionList.tsx`
     - Refs: R1 AC5; R2 AC1–4
   - 6.3. [x] Component tests for ingestion flows and errors
     - Prompt: "RTL tests for paste, file, URL, invalid JSON, dedupe, and reorder side-effects on selection."
     - Files: `src/components/UploadPanel.test.tsx`, `src/components/VersionList.test.tsx`
     - Refs: R1 AC1–5; R2 AC1–4

7. [x] TimelineScrubber with Framer Motion
   - 7.1. [x] Implement timeline with labeled stops, draggable playhead, play/pause
     - Prompt: "Create animated timeline; emit adjacent pair selection on scrub/play."
     - Files: `src/components/TimelineScrubber.tsx`
     - Refs: R5 AC1–2; R3 AC2
   - 7.2. [x] Tests for scrubbing behavior and adjacency selection
     - Prompt: "RTL tests asserting selected pair updates when scrubbing and when versions change."
     - Files: `src/components/TimelineScrubber.test.tsx`
     - Refs: R3 AC2–4; R5 AC1–4; R9 AC1–2

8. [x] PairMatrix for all-pairs selection
   - 8.1. [x] Implement N×N matrix with current pair highlight and keyboard navigation
     - Prompt: "Render virtualized matrix for large N; sync selection with timeline."
     - Files: `src/components/PairMatrix.tsx`
     - Refs: R3 AC1; R5 AC3; R11 AC1
   - 8.2. [x] Tests for selection sync and accessibility
     - Prompt: "RTL tests for focus management, ARIA roles, and selection cohesion."
     - Files: `src/components/PairMatrix.test.tsx`
     - Refs: R3 AC1; R5 AC3; R11 AC1–2

9. [x] DiffTreeView with virtualization, legend, collapse, hide unchanged
   - 9.1. [x] Implement virtualized tree renderer with expand/collapse per node and color legend
     - Prompt: "Use react-virtuoso or react-window for tree virtualization; render change types with semantics."
     - Files: `src/components/DiffTreeView.tsx`
     - Refs: R6 AC1–4; R8 AC3
   - 9.2. [x] Global toggle to hide unchanged nodes; lazy-render children
     - Prompt: "Add global switch and lazy load child nodes on expand."
     - Files: `src/components/DiffTreeView.tsx`
     - Refs: R6 AC2, AC5
   - 9.3. [x] Tests for rendering performance and correctness on large trees
     - Prompt: "RTL tests with large fixtures; assert virtualization and expand/collapse behavior."
     - Files: `src/components/DiffTreeView.test.tsx`
     - Refs: R4 AC5; R6 AC1–5; R8 AC3

10. [x] RulesPanel for ignore/transform management
   - 10.1. [x] Implement rule creation (keyPath/glob/regex, transform options), enable/disable, error display
     - Prompt: "Build RulesPanel with validation and rule badges; persist in state."
     - Files: `src/components/RulesPanel.tsx`
     - Refs: R7 AC1–4
   - 10.2. [x] Tests for rule lifecycle and effect on diffs
     - Prompt: "Component tests toggling rules and asserting updated diff nodes."
     - Files: `src/components/RulesPanel.test.tsx`
     - Refs: R7 AC1–4; R12 AC4

11. [x] SearchBar for key/value filtering and highlighting
   - 11.1. [x] Implement search with result navigation and highlights in tree
     - Prompt: "Index DiffNode paths/values; filter/highlight; next/prev shortcuts."
     - Files: `src/components/SearchBar.tsx`
     - Refs: R6 AC3
   - 11.2. [x] Tests for search behavior and keyboard shortcuts
     - Prompt: "RTL tests covering search queries, highlight counts, and navigation."
     - Files: `src/components/SearchBar.test.tsx`
     - Refs: R6 AC3; R11 AC1

12. [x] SessionBar for persistence and theme toggle
   - 12.1. [x] Implement save to localStorage and export `.json`; import session
     - Prompt: "Serialize/deserialize session; guard when storage unavailable."
     - Files: `src/components/SessionBar.tsx`
     - Refs: R10 AC1–4
   - 12.2. [x] Implement theme toggle with animated transitions
     - Prompt: "Animate CSS variables using framer-motion; persist theme in state."
     - Files: `src/components/SessionBar.tsx`, `src/styles/theme.css`
     - Refs: R9 AC3; R16 AC2–3
   - 12.3. [x] Tests for persistence and theme
     - Prompt: "RTL tests mocking localStorage; assert import/export integrity and themed class changes."
     - Files: `src/components/SessionBar.test.tsx`
     - Refs: R10 AC1–4; R9 AC3

13. [x] Motion polish and micro-interactions
   - 13.1. [x] Add enter/exit transitions for panels, hover/press animations, and timeline transitions
     - Prompt: "Use Motion variants and spring configs (200–300ms) across components."
     - Files: `src/components/**/*.tsx`
     - Refs: R9 AC1–2
   - 13.2. [x] Snapshot/DOM tests to assert motion presence (sanity)
     - Prompt: "Basic tests verifying motion wrappers and variant props exist."
     - Files: `src/components/motion.test.tsx`
     - Refs: R9 AC1–2

14. [x] Accessibility improvements
   - 14.1. [x] Apply ARIA roles/labels and live region updates for diff completion
     - Prompt: "Add roles for treegrid/tree, aria-labels, and polite live region for compute status."
     - Files: `src/components/*.tsx`
     - Refs: R11 AC2–3
   - 14.2. [x] Keyboard navigation and shortcuts (expand/collapse/search)
     - Prompt: "Implement roving tabindex and shortcuts; visible focus outlines and skip links."
     - Files: `src/components/*.tsx`
     - Refs: R11 AC1
   - 14.3. [x] a11y tests with jest-axe/axe-core
     - Prompt: "Add a11y tests ensuring WCAG AA color contrast and landmarks."
     - Files: `tests/a11y.test.tsx`
     - Refs: R11 AC4

15. [x] Security and privacy safeguards
   - 15.1. [x] Enforce local-only default; explicit consent for server compute; CSP
     - Prompt: "Gate API via env and UI consent; add strict CSP in `next.config.js` / headers."
     - Files: `next.config.js`, `app/middleware.ts`, `src/components/Consent.tsx`
     - Refs: R13 AC1–4
   - 15.2. [x] Tests for consent gating and CSP header presence
     - Prompt: "Integration tests for consent flow and CSP headers."
     - Files: `tests/security.test.tsx`
     - Refs: R13 AC1–4

16. [ ] Internationalization scaffolding (English default, future-ready)
   - 16.1. [ ] Centralize copy in a message catalog with English fallback
     - Prompt: "Introduce simple i18n catalog; default en-US; safe fallbacks."
     - Files: `src/i18n/messages.ts`, `src/i18n/index.ts`
     - Refs: R14 AC1–3
   - 16.2. [ ] Tests for missing translation fallback
     - Prompt: "Unit tests ensuring fallback to English without layout breaks."
     - Files: `src/i18n/i18n.test.ts`
     - Refs: R14 AC3

17. [ ] Quality and performance instrumentation (dev-only)
   - 17.1. [ ] Add PerformancePanel with compute/render timings and worker queue depth
     - Prompt: "Instrument timings via `performance.now()` and React Profiler; guard behind dev flag."
     - Files: `src/components/PerformancePanel.tsx`
     - Refs: R15 AC3
   - 17.2. [ ] Unit tests for metrics collection toggling; ensure no PII
     - Prompt: "Tests asserting metrics enabled only when opted-in; no payload logging."
     - Files: `src/components/PerformancePanel.test.tsx`
     - Refs: R15 AC4

18. [ ] End-to-end scenarios (automated only)
   - 18.1. [ ] Playwright tests: multi-input ingest → timeline scrub → rules apply → search → export/import
     - Prompt: "Author E2E covering primary flows; assert performance thresholds on fixtures (first diff < 3s)."
     - Files: `e2e/specs/core.spec.ts`
     - Refs: R1 AC1–5; R2 AC1–4; R3 AC2–4; R5 AC1–4; R6 AC1–5; R7 AC1–4; R8 AC1–4; R10 AC1–4; R9 AC1–3

Notes:
- Each step builds on earlier ones; avoid orphan components. Integrate tests and code in small increments.
- If gaps in design/requirements are found, return to prior phase for clarification before proceeding.
