# Milestone 2 — Dashboard, navigation and design system

Branch `milestone-2` (from `milestone-1`). Started 14 November 2026 on the owner's instruction.

## Objectives

1. A design system that every later module uses: tokens, buttons, panels, page headers, status
   badges, measurement displays, numeric parameter controls and icons, meeting NFR-03 (touch
   targets ≥ 44 px), NFR-04 (measurement values ≥ 20 px, text contrast ≥ 4.5:1) and NFR-10
   (keyboard operable, text alternatives).
2. The application shell: header with the designer badge (D6), primary navigation to the eight
   dashboard areas of master instruction §6, a skip link, page titles, and a layout that works
   from 768 px tablets to 1920 px projectors.
3. The seven-region laboratory layout (FR-02) used by every module page, with placeholders that
   state which milestone fills each region. No measurement value is invented: empty measurements
   show "—".
4. The LocalStorage `Repository` adapter (architecture §5): versioned envelopes, migrations,
   export, import and clear, with a safe in-memory fallback when browser storage is blocked.

## Scope decisions

| Decision                                                                                       | Reason                                                                                          |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| React Router 7.18.5 (declarative mode), not 6.x                                                | 6.x has two open advisories with no 6.x fix; 7.18.5 fixes both and keeps the same component API |
| Route pages are lazily loaded                                                                  | Architecture rule "lazy loading"; keeps the first bundle small                                  |
| Design tokens move to `src/design-system/tokens.ts`; Tailwind reads them                       | One source of truth, so contrast tests check the colours actually used                          |
| Icons are inline SVG components, no icon library                                               | "Avoid unnecessary dependencies"; consistent 24 px, 2 px stroke                                 |
| Module pages are generic: one `LabShell` reads the registry                                    | NFR-09; module-specific views arrive from Milestone 4                                           |
| Overview shows course mapping from `docs/course-alignment.md` §3                               | Approved alignment; learning outcomes flagged provisional                                       |
| Student profile form, JSON export button and progress data views are deferred to Milestone 4/9 | Need recorded sessions to be meaningful; the adapter is ready and tested now                    |

## Routes

| Path             | Area (master instruction §6) |
| ---------------- | ---------------------------- |
| `/`              | 1 Welcome page               |
| `/overview`      | 2 Laboratory overview        |
| `/modules`       | 3 Ten laboratory modules     |
| `/modules/:slug` | Module page (seven regions)  |
| `/resources`     | 4 Learning resources         |
| `/activities`    | 5 Experiment activities      |
| `/assessment`    | 6 Assessment centre          |
| `/progress`      | 7 Student progress           |
| `/reports`       | 8 Laboratory reports         |
| anything else    | Not-found page               |

## Tests

- Unit: contrast of every text/background token pair used; WCAG contrast function against
  known values; button size; measurement display formatting, units and "—" for missing values;
  numeric control range validation and messages; navigation list; each route renders its
  heading; unknown module slug; LabShell renders exactly seven labelled regions; repository
  adapter (round trip, envelopes, malformed data, newer schema, migrations, export/import/clear,
  storage failure fallback).
- Playwright (laptop 1366×768 and tablet 768×1024): every dashboard area reachable from the
  navigation; a module page shows the seven regions; touch targets ≥ 44 px; measurement font
  ≥ 20 px; no horizontal scroll; tablet menu toggle; skip link; no console errors.

## Gate

All eight dashboard areas reachable; module pages show the seven-region layout with placeholders;
type check, lint, format, unit tests with coverage, build and Playwright all pass, with output
recorded in `docs/verification/milestone-2.md`.
