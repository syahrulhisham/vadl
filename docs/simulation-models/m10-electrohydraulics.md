# Simulation model: electrohydraulics

| Field            | Value                                                                       |
| ---------------- | --------------------------------------------------------------------------- |
| Model id         | `m10.electrohydraulics`                                                     |
| Module           | M10 – Electrohydraulics                                                     |
| Model class      | dynamic (logic in `project`)                                                |
| Source files     | `src/sim-core/equations/fluidPower.ts`, `src/sim-core/models/hydraulics.ts` |
| Reference cases  | `docs/reference-cases/fluid-power.md`                                       |
| Status           | draft, Milestone 8                                                          |
| Course alignment | course-alignment §5.8–5.10; Festo TP101/TP201/TP501/TP601 used by Labs 2–4b |

## 1. Purpose

Operate the Lab 4a hand-lever and Lab 4b solenoid circuits and relate pressure, flow, force and speed: load pressure, traversing pressure, relief valve, flow control, powers.

## 2. Symbols and units

SI inside (Pa, m², m³/s, N); bar for pneumatics and MPa, L/min for hydraulics at the display
edge, as in the labs. Symbols as in `src/sim-core/equations/fluidPower.ts`.

## 3. Governing equations

```text
(1) v = q/A; t = s/v; φ = A_P/A_PR; p_L = F/A; F = A_P·p1 − A_PR·p2; P = p·q; P_drive = p·q/0.7
(2) orifice q = A·√(2Δp/ρ); passage calibrated to 0.05 MPa at 2 L/min (course H5)
(3) relief: closed below setting − 0.4 MPa, full pump flow at the setting (course measurement)
(4) stroke: q_pump = v·A_in + q_relief(p_pump), p_pump = p_in + Δp_in + p_check
(5) gravity lowering: q_out = A_fcv·√(2·(W/A_PR)/ρ) (minus the pump flow if it joins the outlet)
```

State `[x, K1, K2, K3]`.

## 4. Assumptions

As listed in the model's `assumptions` (shown on screen and in the report).

## 5. Limitations

Quasi-static flow: no air or oil compressibility dynamics, inertia, cushioning or stick-slip.
Ideal valves, contacts and relays. VADL's flow-model constants (passage and flow-control areas)
are assumptions, not equipment data, except the hydraulic passage, which is calibrated to a
course measurement.

## 6. Parameters and valid ranges

Pump 0–10 L/min; relief 0.5–6 MPa; bore 8–100 mm; rod 4 mm to bore; stroke 20–1000 mm; load 0–5000 N; flow control 1–100 %. Warning: load cannot be raised below the relief setting.

## 7. Numerical method

Fastest time constant 0.1 × stroke / fastest speed (pump flow on the annulus or free lowering).

## 8. Outputs

See the model's `outputs` (positions in mm, pressures, flows, coil and sensor states, rung
states, currents, powers).

## 9. Verification

| Case      | Expected                                                                                | Test file                             |
| --------- | --------------------------------------------------------------------------------------- | ------------------------------------- |
| RC-M10-01 | 0.75 MPa; 0.277778/0.166667 m/s; 0.72/1.2 s; 1005.31/612.611 N; 8933.90 N; 238.095 W    | `tests/reference/fluid-power.test.ts` |
| RC-M10-02 | 3.10913 mm²; relief 0/1/2 L/min; lowering 5.37853/3.36581/1.81642 L/min; raise 1.40 MPa | same                                  |

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 8 |
