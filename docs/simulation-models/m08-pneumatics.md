# Simulation model: pneumatics

| Field            | Value                                                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model id         | `m08.pneumatics`                                                                                                                                                |
| Module           | M08 – Pneumatics                                                                                                                                                |
| Model class      | dynamic (logic in `project`)                                                                                                                                    |
| Source files     | `src/sim-core/equations/fluidPower.ts`, `src/sim-core/logic/pneumaticLogic.ts`, `src/sim-core/models/pneumaticCylinder.ts`, `src/sim-core/models/pneumatics.ts` |
| Reference cases  | `docs/reference-cases/fluid-power.md`                                                                                                                           |
| Status           | draft, Milestone 8                                                                                                                                              |
| Course alignment | course-alignment §5.8–5.10; Festo TP101/TP201/TP501/TP601 used by Labs 2–4b                                                                                     |

## 1. Purpose

Operate the Lab 2 circuits (direct and indirect control, OR, AND with memory, AND+OR) and see how valve logic, working pressure, load and flow control set the cylinder force and motion.

## 2. Symbols and units

SI inside (Pa, m², m³/s, N); bar for pneumatics and MPa, L/min for hydraulics at the display
edge, as in the labs. Symbols as in `src/sim-core/equations/fluidPower.ts`.

## 3. Governing equations

```text
(1) A = πD²/4;  A' = π(D² − d²)/4;  F_eff = 0.9·p·A − F_spring        (course/Festo)
(2) OR (shuttle), AND (dual-pressure), memory: set alone → 1, reset alone → 0, else hold
(3) VADL speed model (own):  ṁ_in(ps→pd) = ρ(pd)·A_d·v;  ṁ_out(pe→pa) = ρ(pe)·A_e·v;
    (pd − pa)A_d − (pe − pa)A_e = F_friction + F_load;  isentropic orifice flow, choked below 0.528
(4) restrictions in series: 1/A² = Σ 1/Aᵢ²; valve passage 1.5 mm², flow control up to 2 mm²
```

State `[x, m]`; dx/dt = ±v until an end; `project` clamps x and updates the memory valve.

## 4. Assumptions

As listed in the model's `assumptions` (shown on screen and in the report).

## 5. Limitations

Quasi-static flow: no air or oil compressibility dynamics, inertia, cushioning or stick-slip.
Ideal valves, contacts and relays. VADL's flow-model constants (passage and flow-control areas)
are assumptions, not equipment data, except the hydraulic passage, which is calibrated to a
course measurement.

## 6. Parameters and valid ranges

Supply 0–6 bar; bore 8–100 mm; rod 3–40 mm (< bore); stroke 10–500 mm (100 mm assumed for the lab cylinder, L-21); spring 0–200 N; friction 0–30 %; load 0–2000 N; flow-control opening 1–100 %. Warning: the cylinder stalls in one direction.

## 7. Numerical method

Fastest time constant 0.1 × stroke / fastest speed: each step moves at most 1 % of the stroke, so the end-position sensors are caught. RK4 on a piecewise-constant speed is exact.

## 8. Outputs

See the model's `outputs` (positions in mm, pressures, flows, coil and sensor states, rung
states, currents, powers).

## 9. Verification

| Case      | Expected                                                                | Test file                             |
| --------- | ----------------------------------------------------------------------- | ------------------------------------- |
| RC-M08-01 | 188.496, 156.046, 169.646, 142.503 N; plan case                         | `tests/reference/fluid-power.test.ts` |
| RC-M08-02 | choked meter-out 0.290884 m/s, meter-in 0.934/0.527/0.157 m/s, 6.25 bar | same                                  |

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 8 |
