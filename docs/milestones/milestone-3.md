# Milestone 3 — Simulation engine and graphing system

Branch `milestone-3` (from `milestone-2`). Started 14 November 2026 on the owner's instruction.

## Objectives

1. A reusable, UI-free simulation engine in `src/sim-core/engine`: forward Euler and fourth-order
   Runge–Kutta integrators, a fixed-step clock with an accumulator (results independent of frame
   rate), the step-size rule Δt ≤ τ_min/10, a bounded recorder with downsampling, and a runner
   with start, pause, resume, stop and reset (FR-04).
2. A proving model: the first-order RL circuit, implemented as a `SimModel`, documented and
   verified against its analytic solution.
3. A graphing system in `src/features/graphs`: a live time-trace chart and a characteristic-curve
   chart with the operating point marked (FR-07), both with a text alternative and a data table.
4. A React hook that drives the runner from animation frames, plus a results table that records
   only values the simulation produced (FR-08).
5. The RL circuit running end to end in the seven-region layout, reached from Learning resources.

## Design decisions

| Decision                                                                                   | Reason                                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Integrators take a derivative function and a numeric state vector                          | One implementation serves every dynamic model (architecture §2)                                          |
| Pure clock function `advanceClock` returns the number of whole steps for elapsed real time | Same simulated result on any device; testable without timers                                             |
| Time scale (simulated seconds per real second) is a runner option                          | Electrical transients last milliseconds; students need to slow them down to see them                     |
| Steps per frame are capped; the runner reports `lagging` when it cannot keep up            | A tiny time constant cannot freeze the browser; the student is told the display is slower than requested |
| Runner applies parameter changes only after validation; invalid changes are refused        | FR-05: invalid parameters never reach the model                                                          |
| Recorder is a fixed-capacity ring buffer; charts receive a min–max downsampled copy        | Risk R10 (long traces); min–max keeps peaks visible                                                      |
| Recharts 3.10.1 for charts, animations off                                                 | Plan technology choice; live data must not animate between frames                                        |
| The RL circuit page lives under Learning resources (`/resources/rl-circuit`)               | It is a worked engineering example, not one of the ten laboratories                                      |

## Tests

- Integrators: exponential decay and harmonic oscillator against analytic solutions; measured
  convergence order ≈ 1 (Euler) and ≈ 4 (RK4) when the step is halved.
- Clock: accumulator behaviour, time scale, step cap, negative and huge elapsed times.
- Recorder: capacity, wrap-around order, downsampling keeps first, last, minimum and maximum.
- Runner: state transitions, auto-stop at end time, step-size rule, validation refusal, reset,
  lagging flag.
- RL model: validation, outputs, steady state, energy balance; reference case RC-ENG-01.
- Graph data preparation and accessible table; hook frame driving; results table.
- Playwright: open the RL page, run to completion, read the final current, record a row, check
  the chart drew, pause/resume/reset, at laptop and tablet sizes.

## Gate

Integrators pass analytic tests; the RL circuit runs end to end; all checks pass with output in
`docs/verification/milestone-3.md`.
