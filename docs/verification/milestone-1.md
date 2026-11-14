# Verification report — Milestone 1

Requirements analysis, system architecture and project structure.
Branch `milestone-1`, run on 14 November 2026, Windows 11, Node v24.21.0, npm 11.19.0.

## 1. Repository inspection (plan task 1)

Before anything was created, the repository held:

| Path                         | State                                   | Action                                                              |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `README.md`                  | Committed (2 lines, `e75b217`)          | Kept unchanged; excluded from Prettier so it is never reformatted   |
| `docs/master-instruction.md` | Untracked, owner's requirements         | Kept unchanged; committed as a source document                      |
| `docs/project-plan.md`       | Untracked, owner's approved plan        | Kept unchanged; committed as a source document                      |
| `docs/New Text Document.txt` | Untracked, empty (0 bytes)              | Left untouched and uncommitted; owner may delete it                 |
| Git                          | Repository exists, `main` tracks GitHub | Not re-initialised; `milestone-1` branched from `main` at `e75b217` |

No application code existed, so nothing was reused (D3 still open: confirm a fresh start or
supply earlier files). No existing file was overwritten or deleted.

## 2. Plan tasks (section 10)

| #   | Task                                                          | Result                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inspect existing files                                        | Done, section 1 above                                                                                                                                                                                                                                     |
| 2   | Git `main` and `milestone-1` branch                           | `main` existed; `milestone-1` created                                                                                                                                                                                                                     |
| 3   | Vite + React + TypeScript strict; Tailwind                    | Done (`tsconfig.json` strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)                                                                                                                                                                  |
| 4   | ESLint + Prettier; sim-core import rule                       | Done (`eslint.config.js`)                                                                                                                                                                                                                                 |
| 5   | Vitest with coverage; Playwright laptop + tablet              | Done; sim-core coverage gate 90 % lines                                                                                                                                                                                                                   |
| 6   | Folder structure, placeholder index files, 10-module registry | Done (`src/modules/registry.ts`, `src/modules/m01…m10/`)                                                                                                                                                                                                  |
| 7   | Core interfaces                                               | `SimModel`, `StaticModel`, `LogicModel`, `Issue`, `Measurement` (`sim-core/types.ts`); `ModuleDefinition` (`modules/types.ts`); `Question` (`features/assessment/types.ts`); `LabReport` (`features/reports/types.ts`); `Repository` (`storage/types.ts`) |
| 8   | `CLAUDE.md`                                                   | Done                                                                                                                                                                                                                                                      |
| 9   | `docs/srs.md`, `docs/architecture.md`, model template         | Done (`docs/simulation-models/_template.md`)                                                                                                                                                                                                              |
| 10  | First reference case                                          | `docs/reference-cases/dc-motor-steady-state.md`                                                                                                                                                                                                           |
| 11  | `.env.example`, `.gitignore`; no secrets or personal data     | Done; scan below                                                                                                                                                                                                                                          |
| 12  | Full check, record, commit, tag                               | This report; commit and tag `milestone-1`                                                                                                                                                                                                                 |

## 3. Required automated tests

| Plan requirement                                         | Test                                                                         | Result     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| Application shell renders                                | `tests/unit/app/app.smoke.test.tsx` (4 tests)                                | Pass       |
| Units: rad/s↔rpm, bar→Pa, L/min→m³/s against hand values | `tests/unit/sim-core/units.test.ts` (19 tests)                               | Pass       |
| Exactly ten modules with unique ids                      | `tests/unit/modules/registry.test.ts` (7 tests)                              | Pass       |
| UI import inside sim-core fails lint                     | `tests/unit/lint/sim-core-boundary.test.ts` (6 tests)                        | Pass       |
| Home page loads at laptop and tablet sizes               | `tests/e2e/home.spec.ts` × projects `laptop` (1366×768), `tablet` (768×1024) | Pass (2/2) |

Additional: `tests/unit/i18n/i18n.test.ts` (4 tests). Total 40 unit tests + 2 end-to-end runs.

Hand values used in the units test: 1500 rpm = 50π = 157.0796 rad/s; 175 rad/s = 1671.127 rpm;
6 bar = 600 000 Pa; 10 L/min = 1.666 667 × 10⁻⁴ m³/s; 1.8° = 0.031 415 93 rad.

## 4. Secrets and personal-data scan

`grep -iE "(api[_-]?key|secret|password|token|BEGIN (RSA|PRIVATE)|@utem\.edu\.my|sk-…)"` over all
new files: matches were only prose in documentation (`.env.example`, `CLAUDE.md`, `docs/srs.md`)
and package names in `package-lock.json` (`js-tokens`, `css-tokenizer`). No keys, passwords,
e-mail addresses or student data. `.env` and `.env.*` are git-ignored except `.env.example`.

## 5. Command output (actual, abridged only where marked)

```text
=== npm ci
added 310 packages, and audited 311 packages in 11s
75 packages are looking for funding
8 moderate severity vulnerabilities

=================== npm run typecheck
> tsc --noEmit
[exit code: 0]

=================== npm run lint
> eslint . --max-warnings 0
[exit code: 0]

=================== npm run format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
[exit code: 0]

=================== npm run test:coverage -- --reporter=verbose
 RUN  v5.0.5 C:/Users/User/Documents/GitHub/vadl
      Coverage enabled with v8
 (40 lines of ✓ per-test results — all passed)
 Test Files  5 passed (5)
      Tests  40 passed (40)
Statements   : 100% ( 32/32 )
Branches     : 100% ( 16/16 )
Functions    : 100% ( 15/15 )
Lines        : 100% ( 28/28 )
[exit code: 0]

=================== npm run build
> tsc --noEmit && vite build
vite v8.3.5 building client environment for production...
✓ 19 modules transformed.
dist/index.html                   0.56 kB │ gzip:  0.33 kB
dist/assets/index-BdUFvXQN.css    7.24 kB │ gzip:  2.34 kB
dist/assets/index-C71-scJT.js   145.12 kB │ gzip: 47.25 kB
✓ built in 1.15s
[exit code: 0]

=================== npm run test:e2e
> playwright test
Running 2 tests using 2 workers
  ok 2 [laptop] › tests\e2e\home.spec.ts:7:1 › home page loads with header, ten modules and no horizontal scroll (471ms)
  ok 1 [tablet] › tests\e2e\home.spec.ts:7:1 › home page loads with header, ten modules and no horizontal scroll (474ms)
  2 passed (12.1s)
[exit code: 0]
```

Coverage is measured over `src/**` excluding entry point, barrel `index.ts` and type-only
`types.ts` files. In Milestone 1 that is the units module, the registry, `t()` and the app shell.

## 6. Known issues and open items

| Item                                                                                                                                                               | Assessment                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm audit`: 8 moderate, all one advisory (GHSA-g3hv-75wg-m249, minimatch ReDoS) reached through `typescript-eslint` ≤ 8.72.2 — the newest release is affected too | Development-time lint tool only; never shipped to the browser and only reads this repository's own file globs. Re-check at each milestone; upgrade when a fixed `typescript-eslint` is released |
| A first install with older majors (Vitest 3, ESLint 9) reported 2 critical + 11 moderate advisories                                                                | Resolved by moving to current majors before any commit                                                                                                                                          |
| Playwright covers Chromium only                                                                                                                                    | Firefox and WebKit added in Milestone 10 (NFR-11)                                                                                                                                               |
| D2, D3, D4 inputs not yet supplied                                                                                                                                 | Outcomes and notation remain provisional; see `docs/course-alignment.md`                                                                                                                        |
