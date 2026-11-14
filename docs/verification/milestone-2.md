# Verification report — Milestone 2

Dashboard, navigation and design system. Branch `milestone-2`, run on 14 November 2026,
Windows 11, Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-2.md`.

## 1. Gate

| Gate item                                                   | Evidence                                                                                                       | Result |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| All eight dashboard areas reachable                         | Unit: each route renders its heading; e2e: every area reached by clicking the navigation, laptop and tablet    | Pass   |
| Module pages show the seven-region layout with placeholders | Unit: all ten module pages render exactly seven named regions in order; e2e: DC motor page, deep link + reload | Pass   |
| Type check, lint, format, unit tests, build, Playwright     | Section 4                                                                                                      | Pass   |

## 2. What was built

| Area              | Files                                                                                                       | Notes                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Design tokens     | `src/design-system/tokens.ts`, `tailwind.config.ts`                                                         | Tailwind reads the tokens; 16 text/background pairs tested                               |
| Components        | `Button`, `LinkButton`, `Panel`, `PageHeader`, `StatusBadge`, `MeasurementDisplay`, `NumberControl`, `Icon` | 44 px targets; 24 px measurement values; out-of-range input rejected with an explanation |
| Shell             | `src/app/AppLayout.tsx`, `AppRoutes.tsx`, `navigation.ts`, `pages/*`                                        | Skip link, badge, sidebar ≥ 1024 px, Menu button below, lazily loaded pages, page titles |
| Laboratory layout | `src/features/lab-shell/LabShell.tsx`, `regions.ts`                                                         | Seven regions; placeholders name the milestone; measurement placeholder shows "—"        |
| Course mapping    | `src/modules/courseRefs.ts`, `src/i18n/en.ts`, overview page                                                | From the approved `docs/course-alignment.md` §3                                          |
| Storage           | `src/storage/localStorageRepository.ts`                                                                     | Envelopes, migrations, export/import/clear of `vadl.*` keys only, memory fallback        |

Visual check: screenshots of the welcome, overview and DC motor pages at 1366 × 768 and
768 × 1024 were reviewed. One fix followed: overview table cells no longer wrap mid-phrase on
tablets.

## 3. Tests

| File                                                     | Tests          | Covers                                                                                                                                        |
| -------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/design-system/contrast.test.ts`              | 22             | WCAG formula against known values; every token text pair ≥ 4.5:1; Tailwind uses the tested tokens                                             |
| `tests/unit/design-system/validateNumber.test.ts`        | 4              | Range validation and engineering explanations (FR-05)                                                                                         |
| `tests/unit/design-system/components.test.tsx`           | 14             | Touch-target classes; "—" for no value; formatting; 24 px class; slider/number control; a11y roles                                            |
| `tests/unit/app/routes.test.tsx`                         | 31             | Eight areas; headings; titles; active link; not-found; ten module pages × seven regions; menu                                                 |
| `tests/unit/app/app.smoke.test.tsx`                      | 2              | App renders with the browser router; disclaimer                                                                                               |
| `tests/unit/modules/courseRefs.test.ts`                  | 3              | Course chapter/lab mapping; slug lookup                                                                                                       |
| `tests/unit/storage/localStorageRepository.test.ts`      | 11             | Key names; round trip; malformed, newer-schema and missing-migration data; migrate; import/export/clear isolation; fallback                   |
| Milestone 1 tests (units, registry, i18n, lint boundary) | 36             | Unchanged and passing                                                                                                                         |
| `tests/e2e/home.spec.ts`                                 | 8 × 2 projects | Home; all areas via navigation; seven regions; deep link + reload; measurement ≥ 20 px; targets ≥ 44 px; skip link; tablet menu (tablet only) |

Total: 123 unit tests; 15 Playwright runs passed, 1 skipped by design (the tablet-menu test is
not applicable at laptop width, where the menu button does not exist).

## 4. Command output (actual, abridged where marked)

```text
=================== npm ci
8 moderate severity vulnerabilities           (same advisory as Milestone 1; see §5)

=================== npm run typecheck
> tsc --noEmit
[exit code: 0]

=================== npm run lint
> eslint . --max-warnings 0
[exit code: 0]

=================== npm run format:check
All matched files use Prettier code style!
[exit code: 0]

=================== npm run test:coverage
 RUN  v5.0.5
 Test Files  11 passed (11)
      Tests  123 passed (123)
Statements   : 99.61% ( 262/263 )
Branches     : 96.31% ( 157/163 )
Functions    : 100% ( 106/106 )
Lines        : 100% ( 221/221 )
[exit code: 0]

=================== npm run build
vite v8.3.5 building client environment for production...
✓ 53 modules transformed.
dist/index.html                             0.56 kB │ gzip:  0.33 kB
dist/assets/index-CKbPz1Ur.css             13.57 kB │ gzip:  3.70 kB
dist/assets/WelcomePage-Cp_20Eer.js         1.00 kB │ gzip:  0.48 kB
dist/assets/ModulesPage-Cca7Ca7t.js         1.21 kB │ gzip:  0.59 kB
dist/assets/OverviewPage-DCfpr0zH.js        2.06 kB │ gzip:  0.67 kB
dist/assets/ModulePage-D0QZ5q0-.js          2.20 kB │ gzip:  0.94 kB
dist/assets/InfoPages-DinFbPoc.js           2.38 kB │ gzip:  0.65 kB
dist/assets/index-BuCdNMMT.js             200.53 kB │ gzip: 66.57 kB
 (plus three small shared chunks)
✓ built in 1.68s
[exit code: 0]

=================== npm run test:e2e
Running 16 tests using 6 workers
  ok  [laptop] home page loads with header, badge and disclaimer
  ok  [laptop] a module page shows the seven-region laboratory layout
  ok  [laptop] deep links to module pages work after a reload
  ok  [laptop] measurement values are at least 20 px and show no invented number (NFR-04)
  -   [laptop] tablet menu opens and closes            (skipped: tablet only)
  ok  [laptop] the first Tab reaches the skip link, which moves focus to the content
  ok  [laptop] every dashboard area is reachable from the navigation
  ok  [laptop] navigation links and buttons are at least 44 px tall (NFR-03)
  ok  [tablet] (same eight tests, all passed)
  1 skipped
  15 passed (14.6s)
[exit code: 0]
```

## 5. Issues found and resolved during the milestone

| Issue                                                                               | Resolution                                                                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| React Router 6.30.6 carries two moderate advisories with no 6.x fix                 | Used React Router 7.18.5 (fixed), same declarative API                                         |
| Lint: closing the tablet menu by setting state in an effect                         | Menu state now records the page it was opened on, so it closes on navigation without an effect |
| Tablet e2e: choosing the page already shown left the menu open (real usability bug) | Navigation links close the menu on click; unit and e2e tests added                             |
| Fast-refresh lint warnings for helpers exported beside components                   | Helpers moved to `buttonClasses.ts`, `validateNumber.ts`, `regions.ts`                         |
| Overview table cells wrapped mid-phrase at 768 px                                   | `whitespace-nowrap` on chapter and milestone columns                                           |

Remaining: `npm audit` reports 8 moderate findings, all one advisory (GHSA-g3hv-75wg-m249,
minimatch ReDoS) inside `typescript-eslint`'s dependency tree, as in Milestone 1. Lint-time only;
nothing ships to the browser.

## 6. Deferred, by plan

Student profile form, JSON export/import buttons and progress data views (Milestone 4 and 9);
Firefox and WebKit end-to-end runs (Milestone 10); projector check on real hardware (Milestone 4).
