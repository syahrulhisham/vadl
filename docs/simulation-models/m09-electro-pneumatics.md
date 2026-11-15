# Simulation model: electro-pneumatics

| Field            | Value                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Model id         | `m09.electro-pneumatics`                                                    |
| Module           | M09 – Electro-pneumatics                                                    |
| Model class      | dynamic (logic in `project`)                                                |
| Source files     | `src/sim-core/logic/ladder.ts`, `src/sim-core/models/electroPneumatics.ts`  |
| Reference cases  | `docs/reference-cases/fluid-power.md`                                       |
| Status           | draft, Milestone 8                                                          |
| Course alignment | course-alignment §5.8–5.10; Festo TP101/TP201/TP501/TP601 used by Labs 2–4b |

## 1. Purpose

Build and operate 24 V DC relay control circuits (direct and indirect control, OR, AND, latching, timer, sequences) and find faults.

## 2. Symbols and units

SI inside (Pa, m², m³/s, N); bar for pneumatics and MPa, L/min for hydraulics at the display
edge, as in the labs. Symbols as in `src/sim-core/equations/fluidPower.ts`.

## 3. Governing equations

```text
(1) rung conducts = OR over branches of AND over contacts (NO: source on; NC: source off)
(2) relays settle: repeat the evaluation until K1–K3 stop changing (or report chatter)
(3) timer T1: elapsed time accumulates while its coil is energised; contact closes at the delay
(4) coil current I = U/R, power U²/R; supply current = Σ energised coils
(5) 1V1 single solenoid: 1M1 → extend; double solenoid: memory (1M1 set, 1M2 reset)
```

State `[x1, x2, K1, K2, K3, m1, tT]`.

## 4. Assumptions

As listed in the model's `assumptions` (shown on screen and in the report).

## 5. Limitations

Quasi-static flow: no air or oil compressibility dynamics, inertia, cushioning or stick-slip.
Ideal valves, contacts and relays. VADL's flow-model constants (passage and flow-control areas)
are assumptions, not equipment data, except the hydraulic passage, which is calibrated to a
course measurement.

## 6. Parameters and valid ranges

Supply 1–6 bar; stroke 10–500 mm; flow control 1–100 %; timer 0.1–30 s; up to 8 rungs. Warning: chattering circuit.

## 7. Numerical method

Fastest time constant: min(0.1 × stroke / fastest speed, timer/10).

## 8. Outputs

See the model's `outputs` (positions in mm, pressures, flows, coil and sensor states, rung
states, currents, powers).

## 9. Verification

| Case      | Expected                                          | Test file                             |
| --------- | ------------------------------------------------- | ------------------------------------- |
| RC-M09-01 | 0.5 A, 12 W; 24.0832 V; 41.3793 mA                | `tests/reference/fluid-power.test.ts` |
| RC-M09-02 | indirect, latch, Part D order 1A1+ 2A1+ 1A1− 2A1− | same                                  |

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 8 |
