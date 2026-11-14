# Verification report — Milestone 3

Simulation engine and graphing system. Branch `milestone-3`, final run on 15 November 2026,
Windows 11, Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-3.md`.

## 1. Gate

| Gate item                                   | Evidence                                                                                                                                                      | Result |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Integrators pass analytic tests             | Exponential decay (e^(−1)), harmonic oscillator (cos 1, −sin 1), energy conservation; measured error ratio on halving the step: Euler 1.9–2.1, RK4 15–17      | Pass   |
| RL circuit runs end to end as proving model | Reference case RC-ENG-01 (i(τ) … i(5τ) within 1e−6 A); in Chromium the page runs on real animation frames to 5τ and reads 0.9933 A at laptop and tablet sizes | Pass   |
| All checks pass                             | Section 4                                                                                                                                                     | Pass   |

## 2. What was built

| Area                | Files                                                                           | Notes                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Integrators         | `src/sim-core/engine/integrators.ts`                                            | Euler and RK4 over any numeric state vector; `integrate` lands exactly on the end time                           |
| Fixed-step clock    | `src/sim-core/engine/clock.ts`                                                  | Accumulator; time scale; step cap with `lagging` flag                                                            |
| Recorder            | `src/sim-core/engine/recorder.ts`                                               | Ring buffer; min–max downsampling                                                                                |
| Runner              | `src/sim-core/engine/runner.ts`                                                 | Start, pause, resume, stop, reset; Δt = min(maxDt, τ/10); validated parameter changes; end time; version counter |
| Proving model       | `src/sim-core/equations/circuits.ts`, `src/sim-core/models/rlCircuit.ts`        | Documented in `docs/simulation-models/engine-rl-circuit.md`                                                      |
| React hook          | `src/hooks/useSimulation.ts`                                                    | Animation-frame loop (injectable); at most 0.1 s credited per frame                                              |
| Graphs              | `src/features/graphs/*`                                                         | Recharts 3.10.1, animations off; figure caption, screen-reader description, data table                           |
| Results table       | `src/features/recording/*`                                                      | Rows captured on Record only                                                                                     |
| Worked-example page | `src/app/pages/rl/*`, route `/resources/rl-circuit`, link in Learning resources | Six of seven regions filled; assessment placeholder until Milestone 4                                            |

The RL value readings observed live in Chromium during development matched the hand
calculation at each time constant: 0.632, 0.865, 0.950, 0.982 and 0.993 A at 1τ to 5τ.

## 3. Tests

| File                                            | Tests          | Covers                                                                                                         |
| ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `tests/reference/rl-circuit.test.ts`            | 7              | RC-ENG-01: τ, I∞, di/dt(0), stored energy; i at 1, 2, 3, 5 τ (RK4); v_R, v_L at τ; Euler at Δt = τ/1000        |
| `tests/unit/sim-core/integrators.test.ts`       | 12             | Single steps; analytic solutions; energy; exact landing; order of accuracy                                     |
| `tests/unit/sim-core/clock-recorder.test.ts`    | 12             | Accumulator, frame-rate independence (30 vs 120 fps), time scale, cap; ring buffer; downsampling keeps a spike |
| `tests/unit/sim-core/runner.test.ts`            | 17             | Controls and status; finishing at the end time; step-size rule; lagging; record interval; validation           |
| `tests/unit/sim-core/rlCircuit.test.ts`         | 9              | Equations; validation messages; v_R + v_L = V; no overshoot; V = 0; energy balance                             |
| `tests/unit/hooks/useSimulation.test.tsx`       | 5              | Frame driving with fake frames; 0.1 s cap; frames stop when paused, finished or unmounted                      |
| `tests/unit/features/graphs-recording.test.tsx` | 10             | Chart rows, scaling, downsampling, time units, curve sampling; figure description and table; results table     |
| `tests/unit/app/rlPage.test.tsx`                | 6              | Link from resources; regions filled; initial values; τ update; range rejection; locking; record and clear      |
| Milestone 1–2 tests                             | 123            | Unchanged and passing                                                                                          |
| `tests/e2e/rl-circuit.spec.ts`                  | 3 × 2 projects | Full run to 5τ with final values, both curves, operating point, record, reset; pause/resume; τ change          |
| `tests/e2e/home.spec.ts`                        | 8 × 2 projects | As in Milestone 2                                                                                              |

Total: 201 unit and reference tests; 21 Playwright runs passed and 1 skipped by design (the
tablet-menu test does not apply at laptop width).

## 4. Command output (actual, abridged where marked)

```text
=================== npm ci
8 moderate severity vulnerabilities           (same lint-tool advisory as before; see §5)
[exit code: 0]

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
 Test Files  19 passed (19)
      Tests  201 passed (201)
 (files below 100 % only)
 sim-core/engine   |   97.24 |    88.52 |   97.77 |   98.43 |
  recorder.ts      |   96.15 |    78.57 |     100 |     100 | 77-85
  runner.ts        |   96.96 |    89.47 |   96.66 |    97.5 | 89,249-250
 app/pages/rl      |   85.96 |       85 |      72 |   86.79 |
Statements   : 97.69% ( 635/650 )
Branches     : 93.17% ( 355/381 )
Functions    : 96.39% ( 214/222 )
Lines        : 98.22% ( 553/563 )
[exit code: 0]

=================== npm run build
dist/assets/index-DkR-2dt1.js             206.38 kB │ gzip:  68.75 kB
dist/assets/RlCircuitPage-JsuO2xQk.js     403.85 kB │ gzip: 116.04 kB
 (plus nine page and shared chunks, each under 3.1 kB)
✓ built in 1.87s
[exit code: 0]

=================== npm run test:e2e
  ok  [laptop] the RL circuit runs to completion and matches the analytic result
  ok  [laptop] pause holds the simulated time; resume continues
  ok  [laptop] changing L before the run changes the time constant
  ok  [laptop] (seven Milestone 2 tests; tablet-menu test skipped at laptop width)
  ok  [tablet] (same eleven tests, all passed)
  1 skipped
  21 passed (20.8s)
[exit code: 0]
```

The simulation-core coverage gate (≥ 90 % of lines) is met: every `src/sim-core` file is at
98.4 % of lines or above; files not listed are at 100 %. The RL page's uncovered lines are the
playback selector and running-state branches, which the Playwright tests exercise in a real
browser.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                              | Resolution                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| A run could reach its end time without signalling a change, leaving the page showing "Running" (found in Chromium) | `finish()` now bumps the version; regression test "signals finishing even when the last frame takes no counted step"        |
| My integrator test demanded 5e−10 agreement where RK4's own error at that step is 4e−8                             | Tolerance set to 1e−6, which still detects a missed or extra final step (error ≈ 0.04)                                      |
| Universal-curve axis label clipped                                                                                 | Label shortened to "i/I∞ (%)"                                                                                               |
| Non-null assertions in a test (lint)                                                                               | Replaced with typed casts                                                                                                   |
| Intermittent test failure under the parallel coverage run: a lazily loaded page took 1.3 s, over the 1 s wait      | Testing Library wait raised to 5 s for the whole suite (`tests/setup.ts`); three consecutive full coverage runs then passed |

Remaining: `npm audit` reports the same 8 moderate findings as Milestones 1 and 2 (one minimatch
advisory inside `typescript-eslint`, lint-time only). Recharts 3.10.1 added no advisories.

## 6. Notes for later milestones

- The chart library adds about 116 kB gzipped, loaded only on pages that chart.
- The step-size rule caps Δt at τ/10. The DC motor (Milestone 4) has two time constants
  (electrical La/Ra and mechanical); `fastestTimeConstant` must return the smaller.
- Assessment in the RL page waits for the assessment engine (Milestone 4).
