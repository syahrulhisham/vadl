# CLAUDE.md — VADL project memory

Virtual Actuator and Drives Laboratory (VADL) for BELK 3423 Actuator and Drives, UTeM.
Browser-based, client-only React + TypeScript application with ten laboratory modules.

Authoritative sources, in order: `docs/master-instruction.md` (requirements),
`docs/project-plan.md` (approved plan), `docs/decisions.md` (approved decisions D1–D12),
then `docs/srs.md` and `docs/architecture.md`.

## Current status

| Milestone | Scope                                                                     | Status                                                                 |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1         | Requirements, architecture, project structure                             | Done and approved; tag `milestone-1`                                   |
| 2         | Dashboard, navigation, design system                                      | Done and approved; tag `milestone-2`                                   |
| 3         | Simulation engine and graphing                                            | Done and approved; tag `milestone-3`                                   |
| 4         | DC motor laboratory (reference module), thin assessment, report, progress | Done and approved; tag `milestone-4`                                   |
| 5         | AC motor drives (M02) and power converters (M03) laboratories             | Done and approved; tag `milestone-5`                                   |
| 6         | Stepper motors (M04) and servo motors (M05) laboratories                  | Done and approved; tag `milestone-6`                                   |
| 7         | Mechanical transmission (M06) and cam and follower (M07) laboratories     | Done and approved; tag `milestone-7`                                   |
| 8         | Pneumatics (M08), electro-pneumatics (M09), electrohydraulics (M10)       | Done on branch `milestone-8`, tag `milestone-8`; awaiting owner review |
| 9–10      | See `docs/project-plan.md` section 6 and `docs/course-alignment.md` §5    | Not started                                                            |

Course materials (D2) were examined on 14 Nov 2026: see `docs/course-alignment.md` for the
learning outcomes, the notation VADL adopts, the approved plan changes (§5, which override `docs/project-plan.md` where they differ) and the
lecturer questions. Learning outcomes stay **provisional** until the lecturer answers.
Still outstanding: confirmation of a fresh start (D3) and the actual UTeM bench data (D4, L-21).

**Course materials are confidential.** They live in the git-ignored `course-materials/`. Never
commit them, never quote examination questions or answer schemes in the repository, and keep
examination-derived analysis in `course-materials/_vadl-analysis/` only.

## Commands

```bash
npm install              # install (Node >= 22.12)
npm run dev              # dev server, http://localhost:5173
npm run typecheck        # tsc --noEmit, strict
npm run lint             # ESLint, zero warnings allowed
npm run format:check     # Prettier
npm test                 # Vitest unit + reference tests
npm run test:coverage    # with coverage; sim-core gate >= 90 % lines
npm run build            # type check + production build to dist/
npm run test:e2e         # Playwright (builds, then serves dist/ on :4173)
npm run check            # everything above, in order
npx playwright install chromium   # one-time browser download for e2e
```

## Layer rules (enforced)

```
app / modules (UI)  →  features  →  hooks, storage  →  sim-core
```

Dependencies point downward only.

- `src/sim-core` imports nothing from React, the DOM, or any folder above it. Enforced by
  `eslint.config.js` (`no-restricted-imports`, `no-restricted-globals`) and proven by
  `tests/unit/lint/sim-core-boundary.test.ts`.
- The UI never computes an engineering value. It displays model outputs.
- UI code imports the core from `@/sim-core`, not deep paths.
- A laboratory is added by registering one definition in `src/modules/registry.ts` (NFR-09).

## Engineering rules

- **SI inside, display units at the edge.** Core functions take and return rad/s, N·m, A, V,
  Pa, m³/s, m, s. Conversions live only in `src/sim-core/units`.
- **No invented numbers.** Never use random values or animation values as measurements.
  Randomness is only for seeded assessment parameters.
- **Every equation function** carries a comment block: formula, symbols, units, assumptions,
  source; and has a reference test whose expected value was worked by hand in
  `docs/reference-cases/` _before_ the test was written. Expected values in tests are literal
  numbers, never recomputed with the code's own formula.
- **Every model** has a document in `docs/simulation-models/` from `_template.md`, stating
  assumptions and limitations, which are also shown on screen and in reports.
- Dynamic models: RK4 by default, Euler available; step ≤ one tenth of the fastest time constant.
- Never describe VADL as industrial-grade or as a replacement for physical labs or tools such as
  MATLAB/Simulink or PSIM.

## Code conventions

- TypeScript strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`.
- `import type` for type-only imports (lint-enforced).
- All interface text in `src/i18n/en.ts` (decision D5); components call `t(key)`.
- Colours via Tailwind tokens `navy-*` and `lightblue-*` only; no raw hex in components.
- Header shows the "Design by Syahrul Hisham™" badge on every page (D6). No UTeM logo until
  permission is confirmed.
- Touch targets ≥ 44 px; measurement values ≥ 20 px on screen (NFR-03, NFR-04).
- Tests: unit tests in `tests/unit` mirror `src`; reference tests in `tests/reference`;
  Playwright in `tests/e2e` at laptop (1366×768) and tablet (768×1024).

## Privacy and security

- No secrets anywhere in the repo or bundle. `VITE_*` variables are public; never put a secret
  in one. See `.env.example`.
- Student data stays in the browser (LocalStorage, keys `vadl.v1.*`). Nothing is transmitted.
- Prototype scores are for self-study only (D11), not official marks.

## Definition of done (per milestone)

1. Objectives and plan written; features implemented.
2. Type check, lint, format check, unit/reference tests with coverage gate, production build and
   Playwright all pass; actual output recorded in `docs/verification/milestone-N.md`.
3. Documentation and this file updated.
4. Committed on a `milestone-N` branch and tagged `milestone-N`.
5. Project owner approves before the next milestone starts. Never claim a feature works unless
   a test shows it.

## Git

- Work on `milestone-N` branches; never commit directly to `main`.
- Do not overwrite or delete existing files without the owner's permission.
- `docs/New Text Document.txt` (empty, owner's file) is intentionally left untracked.
