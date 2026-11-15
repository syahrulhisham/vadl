# Verification report — Milestone 5

AC motor drives (M02) and power converters (M03) laboratories, with shared laboratory parts.
Branch `milestone-5` (from `milestone-4`), run on 15 November 2026, Windows 11, Node v24.21.0,
npm 11.19.0. Plan: `docs/milestones/milestone-5.md`. Models:
`docs/simulation-models/m02-induction-motor.md`, `docs/simulation-models/m03-power-converters.md`.

## 1. Gate

The plan's gate: both laboratories run end to end and match the hand-worked reference cases; all
checks pass.

| Item                                          | Evidence                                                                                                                                                              | Result |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Induction-machine equations match hand values | RC-M02-01 to -05: 13 reference tests (Q1 at 1750 rpm, V/f, stator voltage, rotor resistance, corrected course example)                                                | Pass   |
| Converter equations match hand values         | RC-M03-01 to -04: 21 reference tests (Lab 1 rms table, three-phase bridge, choppers, inverters)                                                                       | Pass   |
| Numerical statistics match closed forms       | Rectifier averages and rms to ~1e−9 relative (integration split at switching instants); PWM fundamental 113.2 V numeric against 113.1 V formula                       | Pass   |
| AC laboratory runs in a real browser          | Chromium, laptop and tablet: 1750 rpm, slip 2.778 %, 118.6 N·m, PF 0.8582, η 92.27 % (RC-M02-01); stator-voltage control → 1550 rpm                                   | Pass   |
| Converter laboratory runs in a real browser   | Lab 1 half-wave thyristor at 240 V: 108, 81.03, 27.01, 0 V at α 0/60/120/180°; buck 19.2 V, ΔI 0.576 A; inverter V1 113.1 V; report graph from the four recorded rows | Pass   |
| DC laboratory unchanged after the refactor    | All Milestone 4 unit and e2e tests pass on the shared parts                                                                                                           | Pass   |
| All checks                                    | Section 4                                                                                                                                                             | Pass   |

## 2. What was built

| Area                    | Files                                               | Notes                                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Induction machine       | `src/sim-core/equations/inductionMachine.ts`        | Course approximate circuit, per-phase Vs, mechanical ωs = 4πf/p; slip, Ir, Zi, Pg, Td, Smax, Tmax, Tst                                                                                     |
| Induction motor model   | `src/sim-core/models/inductionMotor.ts`             | State [ω, θslip]; DOL, stator voltage, rotor resistance, V/f, frequency above base; five presets from course examples                                                                      |
| Waveforms               | `src/sim-core/equations/waveforms.ts`               | Seven rectifier circuits, buck/boost/buck-boost, square wave, bipolar/unipolar SPWM, six-step, three-phase SPWM; `waveStats` (piecewise midpoint rule), `harmonicRms`, `thd`               |
| Power converter model   | `src/sim-core/models/powerConverter.ts`             | State [t]; instantaneous values plus cached period statistics; characteristic Vavg against α, D or ma                                                                                      |
| Shared laboratory parts | `src/features/lab-shell/*`, `src/features/graphs/*` | `useLabRecords`, run controls, record panel, activities, theory, outcomes; `formatTick`; µs time unit. DC laboratory refactored onto them                                                  |
| AC laboratory           | `src/modules/m02-ac-motor/*`                        | Theory (course notation), rotating-field view, control-method knobs, readouts, speed and torque traces, torque–speed curves with load line and operating point, activities, 8 questions    |
| Converter laboratory    | `src/modules/m03-power-converters/*`                | Lab 1 supply (120/220/240 V) and α (0–180°) buttons, block diagram, oscilloscope (last two periods), one-period charts, characteristic, DCM warning, activities, 8 questions, report graph |
| Registration            | `src/modules/labs.ts`, `src/modules/registry.ts`    | M02 and M03 `available`                                                                                                                                                                    |

Questions are original to VADL; none is copied from course examinations. Calculation keys come
from the sim-core functions verified in `tests/reference`, and 200 seeds per calculation question
are checked for physical answers.

Machine and converter values are textbook-typical or taken from course examples (D4: UTeM bench
data not yet supplied); the pages say so.

## 3. Tests

| File                                               | Tests           | Covers                                                                                                                                                |
| -------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/reference/ac-motor.test.ts`                 | 13              | RC-M02-01 to -05                                                                                                                                      |
| `tests/reference/power-converters.test.ts`         | 21              | RC-M03-01 to -04                                                                                                                                      |
| `tests/unit/sim-core/inductionMotor.test.ts`       | 14              | Validation; each control method; settles to the algebraic operating point; slip angle wraps; step-size rule                                           |
| `tests/unit/sim-core/powerConverter.test.ts`       | 17              | Periods; gate pulses; carrier; statistics against closed forms; DCM detection; characteristic; runner; piecewise integration exact at a jump          |
| `tests/unit/app/m02m03Labs.test.tsx`               | 9               | Seven regions; standstill values; control-method knobs; recording; Lab 1 buttons; family switch and DCM warning; question banks (200 seeds per calc.) |
| `tests/unit/features/graphs-recording.test.tsx`    | 11              | Added: `formatTick` and the µs unit                                                                                                                   |
| `tests/unit/app/routes.test.tsx`, `dcLab.test.tsx` | updated         | Planned-module test now uses Milestone 6's stepper motors; reports page lists three reports                                                           |
| Milestone 1–4 tests                                | unchanged       | Passing                                                                                                                                               |
| `tests/e2e/ac-pc-labs.spec.ts`                     | 2 × 2 projects  | AC run to RC-M02-01 and stator-voltage control; converter Lab 1 table, buck, inverter, report graph; no horizontal overflow; no console errors        |
| Earlier e2e files                                  | 15 × 2 projects | As in Milestones 2–4                                                                                                                                  |

Total: 358 unit and reference tests; 33 Playwright runs passed, 1 skipped by design (tablet-menu
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
All matched files use Prettier code style!
[exit code: 0]
=================== npm run test:coverage
 Test Files  32 passed (32)
      Tests  358 passed (358)
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |     88.7 |     100 |   98.96 |
 ...core/equations |   99.52 |    97.32 |     100 |     100 |
 sim-core/models   |   99.09 |    95.85 |     100 |   99.34 |
Statements   : 94.45% ( 1788/1893 )
Branches     : 91.56% ( 944/1031 )
Functions    : 86.92% ( 532/612 )
Lines        : 94.78% ( 1617/1706 )
[exit code: 0]
=================== npm run build
dist/assets/AcMotorLab-CQrRiGOz.js          11.95 kB │ gzip:   3.78 kB
dist/assets/PowerConverterLab-CRsSMJGz.js   14.20 kB │ gzip:   4.31 kB
dist/assets/DcMotorLab-D4EFM9SS.js          15.77 kB │ gzip:   4.63 kB
dist/assets/index-B5UeUxc4.js              143.95 kB │ gzip:  47.23 kB
dist/assets/graphs-Cx87mNNc.js             385.48 kB   (charts; loaded only by pages that chart)
 (plus 21 smaller files)
✓ built in 3.31s
[exit code: 0]
=================== npm run test:e2e
  ok  [laptop] AC motor reaches RC-M02-01 and stator-voltage control slows the fan to 1550 rpm (26.5s)
  ok  [laptop] power converters: Lab 1 tables, buck converter and PWM inverter (31.1s)
  ok  [tablet] AC motor reaches RC-M02-01 and stator-voltage control slows the fan to 1550 rpm (19.9s)
  ok  [tablet] power converters: Lab 1 tables, buck converter and PWM inverter (30.0s)
  ok  (all Milestone 2–4 tests at both sizes; tablet-menu test skipped at laptop width)
  1 skipped
  33 passed (1.4m)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, equations 100 %, models 99.34 %,
units 100 %. Laboratory pages are at 62–78 % of lines in unit tests; their running-state paths
are exercised by the Playwright tests in a real browser.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                                                  | Resolution                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accuracy:** rectifier averages were off at the firing-angle jump (Lab 1 at α 120° showed 27 V instead of 27.01 V), because sample cells straddled it | `waveStats` splits the period at the switching instants (`rectifierBreakpoints`); error fell from ~1e−3 to ~1e−9 relative; regression tests |
| Layering: `features` imported constants from `modules`; constants exported beside components                                                           | Moved into `labConstants.ts` and `labContent.ts` in `features/lab-shell`                                                                    |
| Axis ticks showed floating-point noise                                                                                                                 | `formatTick` (four significant figures) in both chart types                                                                                 |
| Field view: the "field" label overlapped its arrow                                                                                                     | Label moved                                                                                                                                 |
| The two new e2e tests exceeded the 30 s default when all workers shared the CPU (both had reached their last step)                                     | Marked `test.slow()`; they take 20–31 s under full load                                                                                     |

## 6. Open items for the owner's review

- **Course alignment:** learning outcomes stay provisional; lecturer questions in
  course-alignment §8 still apply (for example, the course example corrected in RC-M02-05).
- **Bench data (D4):** machine and converter values are textbook-typical or course-example
  values until the UTeM bench data arrive; Lab 1 readings can then be compared with the bench.
- **Model limits shown to students:** induction motor without electrical transients, saturation
  or skin effect (approximate circuit as taught); ideal switches without source inductance,
  overlap or dead time; inductive-load converters with ripple-free current.
- **Projector check:** as for Milestone 4, a check on a real classroom projector is still to be
  done in the room.
