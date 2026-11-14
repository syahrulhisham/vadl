# Verification report — Milestone 4

DC motor laboratory (reference module), with thin assessment, report and progress (D9).
Branch `milestone-4`, run on 15 November 2026, Windows 11, Node v24.21.0, npm 11.19.0.
Plan: `docs/milestones/milestone-4.md`. Model: `docs/simulation-models/m01-dc-motor.md`.

## 1. Gate

The plan's gate for this milestone is **the owner's review of the full module** before any other
laboratory is started. This report gives the evidence for that review.

| Item                                                    | Evidence                                                                                                                                | Result |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Equations reproduce hand calculations                   | RC-M01-01 to -05: 31 reference tests (equation level)                                                                                   | Pass   |
| Dynamic model settles to the algebraic steady states    | 8 tests: RC-M01-01, shunt, RC-M01-02 converter-fed, series, friction, field weakening, starting current                                 | Pass   |
| Laboratory runs end to end in a real browser            | Chromium, laptop and tablet: 1671 rpm, 20 A, 90.91 % (RC-M01-01); live Va 180 V → 1353 rpm; converter-fed 45 A, 58.95 rad/s (RC-M01-02) | Pass   |
| Seven regions filled                                    | Unit and e2e tests; no placeholders on the DC page                                                                                      | Pass   |
| Assessment, report, progress work from stored data only | Unit tests with injected storage; e2e: answer → report score → progress row                                                             | Pass   |
| All checks                                              | Section 4                                                                                                                               | Pass   |

## 2. What was built

| Area                 | Files                                              | Notes                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Converter equations  | `src/sim-core/equations/converters.ts`             | 1-φ and 3-φ half-wave, semi, full, dual; dual converter 2 with the sign the slides omit                                                                                                                                                       |
| DC machine equations | `src/sim-core/equations/dcMachines.ts`             | Course notation; series motor with linear magnetics; load law T = C·Tr·(n/nr)^k                                                                                                                                                               |
| Dynamic model        | `src/sim-core/models/dcMotor.ts`                   | Separately excited, shunt, series; DC or converter supply; Rst; four presets; characteristic functions                                                                                                                                        |
| Engine addition      | `project()` in `SimModel`, applied by the runner   | Single-quadrant converters hold Ia ≥ 0                                                                                                                                                                                                        |
| Laboratory           | `src/modules/m01-dc-motor/*`                       | Theory (course notation), diagram for each motor type, controls (live supply/load changes), 12 readouts, speed and current traces, torque–speed characteristic with load line and operating point, 5 activities at three levels, 11 questions |
| Assessment (thin)    | `src/features/assessment/*`                        | Seeded generator; ±2 % marking with unit and sign hints; per-choice explanations; attempts saved                                                                                                                                              |
| Report (thin)        | `src/features/reports/*`, `/reports/:moduleId`     | Ten sections; profile (D10) and student text saved; graph from recorded rows; print to PDF (D7)                                                                                                                                               |
| Progress (thin)      | `src/features/progress/*`, progress page           | Activities completed, rows recorded, correct answers, reports printed, last opened                                                                                                                                                            |
| Storage wiring       | `RepositoryProvider`, `keys.ts`, `useStoredValue`  | Browser storage with memory fallback                                                                                                                                                                                                          |
| Registration         | `src/modules/labs.ts`, registry status `available` | Module page renders the built laboratory                                                                                                                                                                                                      |

Questions are original to VADL; none is copied from course examinations. Calculation keys are
computed by the sim-core functions verified in `tests/reference`, and 200 seeds per calculation
question are checked for physical answers.

Machine values are textbook-typical (D4: UTeM bench data not yet supplied); the page says so.

## 3. Tests

| File                                       | Tests           | Covers                                                                                                                                                                                           |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/reference/dc-converters.test.ts`    | 11              | RC-M01-04: every tabulated converter average, 1-φ and 3-φ, dual                                                                                                                                  |
| `tests/reference/dc-motor.test.ts`         | 12              | RC-M01-01, -02, -03 (Tutorial 1 Q6–Q9), -05 at equation level                                                                                                                                    |
| `tests/reference/dc-motor-dynamic.test.ts` | 8               | Dynamic model settles to each steady state; starting-current bounds                                                                                                                              |
| `tests/unit/sim-core/dcMotor.test.ts`      | 20              | Validation messages; supply and field; converter classes; no negative current on single-quadrant converters; passive load at standstill; reversal; step-size rule; characteristic functions      |
| `tests/unit/features/assessment.test.tsx`  | 13              | Generator determinism; parsing; tolerance; hints; MCQ feedback; bank integrity; 200 seeds per calculation; independent hand formula; card and panel                                              |
| `tests/unit/app/dcLab.test.tsx`            | 11              | Seven regions; values at rest; presets; locking while running; zero-field refusal; recording and activities saved; report sections, data-only content, print counter; progress and reports areas |
| `tests/unit/hooks/useStoredValue.test.tsx` | 3               | Load and save; **a click before loading finishes is kept and does not overwrite stored data**                                                                                                    |
| `tests/unit/features/progress.test.ts`     | 3               | Progress helpers                                                                                                                                                                                 |
| `tests/unit/app/routes.test.tsx`           | 32              | Updated: planned module shows placeholders; built DC module does not                                                                                                                             |
| Milestone 1–3 tests                        | 170             | Unchanged and passing                                                                                                                                                                            |
| `tests/e2e/dc-lab.spec.ts`                 | 4 × 2 projects  | RC-M01-01 run, live Va control, characteristic, reload persistence; RC-M01-02 run; assessment → report → progress; print layout                                                                  |
| Earlier e2e files                          | 11 × 2 projects | As in Milestones 2–3                                                                                                                                                                             |

Total: 283 unit and reference tests; 29 Playwright runs passed, 1 skipped by design (tablet-menu
test at laptop width).

## 4. Command output (actual, abridged where marked)

```text
=================== npm ci
8 moderate severity vulnerabilities           (same lint-tool advisory as before)
[exit code: 0]
=================== npm run typecheck
[exit code: 0]
=================== npm run lint
[exit code: 0]
=================== npm run format:check
[exit code: 0]
=================== npm run test:coverage
 Test Files  27 passed (27)
      Tests  283 passed (283)
 (simulation core, files below 100 % only)
 sim-core/engine   |   97.26 |    88.7 |   97.77 |   98.44 |
 sim-core/models   |   99.23 |   97.08 |     100 |     100 |
Statements   : 95.53% ( 1156/1210 )
Branches     : 91.31% ( 631/691 )
Functions    : 90.86% ( 388/427 )
Lines        : 96.16% ( 1029/1070 )
[exit code: 0]
=================== npm run build
dist/assets/DcMotorLab-XGzj5b8l.js         25.06 kB │ gzip:   6.89 kB
dist/assets/ReportPage-BHmqCtg1.js          7.14 kB │ gzip:   2.33 kB
dist/assets/index-CHNgArl8.js             143.90 kB │ gzip:  47.27 kB
dist/assets/recording-BLdm1EVf.js         386.58 kB │ gzip: 110.55 kB   (charts; loaded only by pages that chart)
 (plus 18 smaller chunks)
✓ built in 1.77s
[exit code: 0]
=================== npm run test:e2e
  ok  [laptop] separately excited motor reaches RC-M01-01 and armature-voltage control works
  ok  [laptop] converter-fed drive reaches RC-M01-02 (45 A, 58.95 rad/s)
  ok  [laptop] assessment gives immediate feedback; report and progress use the recorded data
  ok  [laptop] print layout hides the application chrome
  ok  [laptop] (ten Milestone 2–3 tests; tablet-menu test skipped at laptop width)
  ok  [tablet] (same fifteen tests, all passed)
  1 skipped
  29 passed (23.0s)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.44 %, models 100 %, equations and units
100 %. The DC laboratory page itself is at 73 % of lines in unit tests; its running-state paths
(live controls, traces during a run) are exercised by the Playwright tests in a real browser.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                                  | Resolution                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Data loss:** a Record pressed before stored data finished loading was overwritten by the load (and could overwrite earlier sessions) | `useStoredValue` queues early changes and replays them on the stored value; regression test |
| **Navigation starved while the motor runs:** per-frame updates kept interrupting React Router's navigation under load                  | Live simulation re-renders are transitions; e2e navigates from a running lab                |
| Diagram: separately excited field circuit ran into the armature wiring; labels overlapped coils; series coil drawn with a stray end    | Field geometry redrawn per motor type; checked in screenshots for all four presets          |
| Theory region very long, stretching the workspace beside it                                                                            | Secondary theory sections collapse                                                          |
| Lint: ref written during render; helpers exported beside components                                                                    | Stable key objects; helpers moved to their own files                                        |
| Test-only slips (regex matching full stops; label matching both number box and slider)                                                 | Tests corrected                                                                             |

## 6. Open items for the owner's review

- **Course alignment:** learning outcomes stay provisional; notation follows the lecture notes.
  Lecturer questions L-2 to L-13 (course-alignment §8) affect details such as the dual-converter
  sign and the four-quadrant diagram.
- **Bench data (D4):** machine values are textbook-typical until the nameplate data arrive.
- **Projector check:** the plan places a projector check in this milestone. Readability rules
  (24 px values, ≥ 4.5:1 contrast, 44 px targets) are tested automatically; a check on a real
  classroom projector needs to be done in the room.
- **Model limits shown to students:** average-value converters (no ripple or discontinuous
  conduction), linear magnetics, passive load only.
