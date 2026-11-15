# VADL maintainer guide

For whoever looks after the VADL code after the prototype. Read `CLAUDE.md` first (rules and
commands), then `docs/architecture.md` (layers and contracts). This guide gathers the routine
tasks.

## 1. Set-up

```bash
npm ci                             # Node >= 22.12
npx playwright install chromium    # once; add firefox webkit for the cross-browser pass
npm run dev                        # http://localhost:5173
npm run check                      # every gate below, in order
```

| Command                     | What it checks                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `npm run typecheck`         | TypeScript strict, no emit                                                            |
| `npm run lint`              | ESLint with zero warnings, including the simulation-core import boundary              |
| `npm run format:check`      | Prettier                                                                              |
| `npm run test:coverage`     | Unit and reference tests; the simulation core must keep ≥ 90 % of lines covered       |
| `npm run build`             | Type check and production build into `dist/`                                          |
| `npm run test:e2e`          | Playwright at laptop (1366 × 768) and tablet (768 × 1024) sizes, including axe audits |
| `npm run test:e2e:browsers` | The integration pass in Edge, Firefox and WebKit (Safari's engine)                    |
| `npm run test:e2e:base`     | A build for the sub-folder `/vadl/`, served and opened from a deep link               |

`.github/workflows/ci.yml` runs `check`, the Firefox and WebKit pass and the sub-folder check on
GitHub's Ubuntu runners when the repository is pushed.

## 2. Rules that tests enforce

- **Layers.** `app` and `modules` → `features` → `hooks`, `storage` → `sim-core`. The simulation
  core imports nothing from React, the DOM or any layer above it (lint rule plus
  `tests/unit/lint/sim-core-boundary.test.ts`).
- **Units.** SI inside the core; conversions only in `src/sim-core/units`.
- **No invented numbers.** Randomness only for seeded assessment parameters.
- **Reference tests.** Every equation function has a comment block (formula, symbols, units,
  assumptions, source) and a test whose expected value was worked by hand in
  `docs/reference-cases/` **before** the test was written. Expected values are literals.
- **Model documents.** Every model has `docs/simulation-models/<id>.md` from `_template.md`. Its
  assumptions and limitations are also shown on screen and in reports.
- **Interface text** lives in `src/i18n/en.ts` or a laboratory's `content.en.ts` (D5).
- **Accessibility.** Touch targets ≥ 44 px, measurements ≥ 20 px, and no serious or critical axe
  violation on any page (`tests/e2e/accessibility.spec.ts`).

## 3. Adding or changing a laboratory

Each laboratory is a folder `src/modules/mNN-name/`:

| File            | Contents                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| `content.en.ts` | Objectives, theory, assumptions, activities and outcomes (interface text) |
| `questions.ts`  | The question bank; each question names its outcome and level              |
| `results.ts`    | The report definition: parameters, measurement columns, graphs            |
| `<Name>Lab.tsx` | The laboratory page built from the shared laboratory shell                |
| `index.ts`      | A note on what the folder holds                                           |

Steps for a new laboratory:

1. Write the model document and the hand-worked reference cases.
2. Add the equations to `src/sim-core/equations/` and the model to `src/sim-core/models/`, with
   reference and unit tests.
3. Create the module folder as above, using an existing laboratory of the same kind as the
   pattern (M01 for electrical drives, M08 for fluid power).
4. Register it: one entry in `src/modules/registry.ts` (summary and status) and one in
   `src/modules/labs.ts` (lazy page, questions, report, activities, outcomes). The dashboard,
   assessment centre, progress and reports pick it up from there (NFR-09).
5. Add it to the lists in `tests/e2e/integration.spec.ts` and `tests/e2e/accessibility.spec.ts`,
   and to the `LABS` list in `tests/e2e/projector.spec.ts`. That list sets which laboratories
   receive the laboratory layout checks at the projector sizes and the measurement-grid checks at
   all four sizes (1024 × 768, 1280 × 800, 1366 × 768 and 1920 × 1080). A laboratory left out of
   it receives none of those checks, and no test fails to warn you. In the same file, also list
   its meters in `LONG_READINGS` and its number of meter grids in `GRIDS_PER_LAB`; the
   measurement-grid tests fail until both are listed.

## 4. Changing stored data

Student data is in the browser's LocalStorage under keys `vadl.v1.*`. If a stored shape changes,
raise `SCHEMA_VERSION` and add a migration in `src/storage` so existing student data and backup
files still load. Never drop a student's data silently.

## 5. Testing notes

- Unit tests run with at most four workers (`vitest.config.ts`); more starved the jsdom page
  tests on a 12-thread machine. Charts are replaced by a placeholder in jsdom
  (`tests/setup.ts`); real charts are tested by Playwright.
- Playwright runs at most three browsers at once for the same reason.
- Firefox could not be launched on the development machine (a Windows side-by-side error in
  Playwright's Firefox build); it is covered by the CI workflow instead
  (`docs/verification/milestone-10.md`).

## 6. Releasing

1. Run `npm run check` and the cross-browser pass; record the output in a verification report.
2. Build for the chosen host (`docs/guides/deployment.md`) and upload `dist/`.
3. Tag the release in git.

## 7. Confidential material

Course materials live in the git-ignored `course-materials/` and must never be committed, and no
examination question or answer scheme may be quoted in the repository.
