# Verification report — Milestone 10

Integration testing, documentation and deployment readiness. Branch `milestone-10` (from
`milestone-9`), run on 15 November 2026, Windows 11 (build 10.0.26300, 12 logical processors),
Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-10.md`.

## 1. Gate

| Item                                 | Evidence                                                                                                                                               | Result                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Integration of all ten laboratories  | `integration.spec.ts`: each laboratory starts, runs, records a row, stops without overflow; its report shows 10 sections and the row; no console error | Pass                  |
| Deep links to every dashboard area   | Same file, eight areas                                                                                                                                 | Pass                  |
| Chrome (Chromium), laptop and tablet | All Playwright tests at both sizes                                                                                                                     | Pass                  |
| Edge                                 | Integration pass, 11 tests                                                                                                                             | Pass                  |
| Safari engine (WebKit)               | Integration pass, 11 tests                                                                                                                             | Pass                  |
| Firefox                              | Playwright's Firefox does not launch on this machine (section 5); covered by the CI workflow, not yet run                                              | **Not verified here** |
| Accessibility, WCAG 2.1 A/AA (axe)   | 20 pages, no serious or critical violation                                                                                                             | Pass                  |
| Sub-folder deployment                | `/vadl/` build: deep link, navigation, assets, `404.html` fallback                                                                                     | Pass                  |
| Guides                               | `docs/guides/`: student, lecturer, maintainer, deployment                                                                                              | Written               |
| Hosting (D12)                        | Prepared for any static host; the host itself is the owner's choice; nothing deployed                                                                  | Open — owner          |
| All checks                           | Section 4                                                                                                                                              | Pass, except Firefox  |

## 2. What was built

| Area                | Files                                                                       | Notes                                                                                           |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Integration tests   | `tests/e2e/integration.spec.ts`                                             | All ten laboratories and eight areas; runs in every Playwright project                          |
| Accessibility audit | `tests/e2e/accessibility.spec.ts`, `@axe-core/playwright` 4.14.0 (dev only) | Twenty pages, laptop project                                                                    |
| Accessibility fix   | `src/modules/m07-cam-follower/CamLab.tsx`                                   | The scrolling displacement table can be reached by keyboard (axe `scrollable-region-focusable`) |
| Browsers            | `playwright.config.ts`, `npm run test:e2e:browsers`                         | Edge, Firefox and WebKit projects run the integration pass                                      |
| Favicon             | `public/favicon.svg`, `index.html`                                          | Edge and Firefox logged a 404 console error for the missing icon                                |
| Base path           | `vite.config.ts` (`VADL_BASE`), `src/app/basename.ts`, `src/app/App.tsx`    | Root or sub-folder builds; router basename from the build                                       |
| Deep links          | `vite.config.ts` (`404.html` copy), `public/_redirects`                     | GitHub Pages, Netlify, Cloudflare Pages; server rules in the deployment guide                   |
| Sub-folder check    | `playwright.base.config.ts`, `tests/e2e-base/`, `npm run test:e2e:base`     | Builds to `dist-base/` (git-ignored) and serves on port 4174                                    |
| CI                  | `.github/workflows/ci.yml`                                                  | Every check, Firefox and WebKit, sub-folder build; runs only when pushed; deploys nothing       |
| Unit-test speed     | `tests/setup.ts`                                                            | Recharts' container is a placeholder in jsdom; the slowest file went from 37 s to 12 s          |
| Guides              | `docs/guides/*.md`                                                          | Student, lecturer, maintainer, deployment                                                       |

## 3. Tests

| File                               | Tests                                              |
| ---------------------------------- | -------------------------------------------------- |
| `tests/e2e/integration.spec.ts`    | 11 × (laptop, tablet, Edge, Firefox, WebKit)       |
| `tests/e2e/accessibility.spec.ts`  | 20, laptop only (skipped at tablet size by design) |
| `tests/e2e-base/base-path.spec.ts` | 2                                                  |
| `tests/unit/app/basename.test.ts`  | 3                                                  |

Total: 559 unit and reference tests; 95 Playwright runs at laptop and tablet size (21 skipped by
design); 22 cross-browser runs passed (Edge, WebKit); 2 sub-folder runs.

## 4. Command output (actual, abridged)

```text
=================== npm ci                       [exit code: 0]  8 moderate (lint-tool advisory, as before)
=================== npm run typecheck            [exit code: 0]
=================== npm run lint                 [exit code: 0]
=================== npm run format:check         [exit code: 0]  All matched files use Prettier code style!
=================== npm run test:coverage
 Test Files  48 passed (48)
      Tests  559 passed (559)
   Duration  48.72s
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/logic    |   96.96 |    95.45 |     100 |   98.75 |
 sim-core/models   |   97.94 |    92.07 |   99.32 |   98.38 |
Statements   : 92.82% ( 4176/4499 )
Branches     : 86.1% ( 2429/2821 )
Functions    : 84.76% ( 1213/1431 )
Lines        : 92.99% ( 3797/4083 )
[exit code: 0]
=================== npm run build
dist/assets/index-Bn4iLHvz.js                 144.31 kB │ gzip:  47.41 kB
dist/assets/graphs-CXIqHnXQ.js                385.48 kB │ gzip: 110.35 kB
✓ built in 2.35s
[exit code: 0]
=================== npm run test:e2e   (laptop and tablet)
  21 skipped
  95 passed (1.9m)
[exit code: 0]
=================== npm run test:e2e:browsers
  [edge]    11 passed
  [webkit]  11 passed
  [firefox] 11 failed: Error: browserType.launch: spawn UNKNOWN   (every Firefox test, at launch)
  11 failed
  22 passed (1.3m)
[exit code: 1]
=================== npm run test:e2e:base
  ok 1 sub-folder build: deep link, navigation and assets (653ms)
  ok 2 the build carries the 404.html fallback for hosts without rewrites (8ms)
  2 passed (9.3s)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, logic 98.75 %, models 98.38 %,
equations and units 100 %. Unit tests took 49 s against 59 s in Milestone 9, with three more
tests.

## 5. Issues found and resolved, and one not resolved

| Issue                                                                             | Resolution                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| axe: the cam laboratory's scrolling table could not be reached by keyboard        | Focusable, named group; the laboratory still has exactly seven regions |
| Edge and Firefox: console error "Failed to load resource: 404" for `/favicon.ico` | VADL icon added                                                        |
| Lint: an `import()` type in the test set-up                                       | `import type`                                                          |
| **Firefox does not launch on this machine** (not resolved)                        | See below                                                              |

**Firefox.** In the first cross-browser run Playwright's Firefox (build 1555) launched and ran
the integration pass; its only error was the missing icon, since fixed. Every later launch failed
with `spawn UNKNOWN`. Starting `firefox.exe` directly reports that the side-by-side configuration
is incorrect, and the Windows event log names the dependent assembly `mozglue` as not found,
although `mozglue.dll` is present. Reinstalling (`npx playwright install --force firefox`) did not
help; Smart App Control is off and no code-integrity event names Firefox. The machine runs a
Windows Insider build (10.0.26300). This is a fault of the test environment, not of VADL, but it
means **Firefox is not verified on this machine**. The CI workflow runs the same tests in Firefox
on Ubuntu once the repository is pushed; checking VADL in an installed Firefox by hand is the
alternative.

## 6. Open items for the owner's review

- **D12 hosting:** choose the host; `docs/guides/deployment.md` compares the options.
- **Firefox:** run the CI workflow (needs a push) or check by hand in Firefox.
- **`README.md`:** still the owner's one-line file; the guides could be linked from it with the
  owner's permission.
- **Classroom projector check:** needs the room (`docs/guides/lecturer-guide.md` §1).
- Still open from earlier milestones: D3 (fresh start), D4 and L-21 (UTeM bench data), the
  lecturer's confirmation of the learning outcomes, L-14.

## 7. Addendum after the owner's approval: continuous integration (15 November 2026)

This section was added after the owner approved Milestone 10. Sections 1 to 6 above are kept as
they were recorded at approval (tag `milestone-10`, commit 2f81eb0). An earlier update (commit
56bcf64) changed two rows of the gate table and the headings of sections 5 and 6 in place; that
was reverted, and the later results are recorded here instead.

The owner merged every milestone branch into `main` and pushed it with the tags. The push
started the CI workflow on GitHub's Ubuntu runner.

| Run         | Commit  | What changed                                        | Duration   | Result  |
| ----------- | ------- | --------------------------------------------------- | ---------- | ------- |
| 43687894677 | 5f9ff51 | First CI run (owner approval recorded in CLAUDE.md) | 5 min 22 s | Success |
| 43688571117 | 56bcf64 | Workflow actions updated to v7 (below)              | 4 min 57 s | Success |

Run 43687894677, test results (abridged from the job log):

```text
 Test Files  48 passed (48)
      Tests  559 passed (559)
  21 skipped
  95 passed (1.7m)                        laptop and tablet
  ✓ [firefox] (each of the 11 integration tests: ten laboratories and the deep-link test)
  22 passed (1.1m)                        Firefox and WebKit
  2 passed (4.0s)                         sub-folder build
```

**Firefox, gate item in section 1:** passed in CI, all 11 integration tests. It remains
unverified on the development machine (section 5). With this, the open item "Firefox" in section
6 is closed and "All checks" pass.

**Workflow update:** the first run warned that `actions/checkout@v4` and `actions/setup-node@v4`
target the deprecated Node.js 20. The workflow now uses `actions/checkout@v7`,
`actions/setup-node@v7` and `actions/upload-artifact@v7`, which run on Node.js 24; run
43688571117 passed with them.
