# Simulation model: mechanical transmission

| Field            | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Model id         | `m06.transmission`                                                              |
| Module           | M06 – Mechanical Transmission                                                   |
| Model class      | dynamic (kinematic: input shaft angle only)                                     |
| Source files     | `src/sim-core/equations/transmission.ts`, `src/sim-core/models/transmission.ts` |
| Reference cases  | `docs/reference-cases/transmission.md` (RC-M06-01 to -06)                       |
| Status           | draft, Milestone 7                                                              |
| Course alignment | LN Ch3 Parts I–II; Tutorial 4; course-alignment §5.6; L-9, L-20                 |

## 1. Purpose

Speed and direction through gear, belt and chain trains, the effect of an idler and of a crossed
belt, belt torque and power from tensions, and the mechanical advantage of lifting pulleys.

## 2. Symbols and units

| Symbol       | Quantity                          | SI unit   | Code name                   |
| ------------ | --------------------------------- | --------- | --------------------------- |
| T, D         | teeth, pulley diameter            | —, m      | `driver`, `driven`, `idler` |
| G            | stage or train ratio              | —         | `overallRatio`              |
| N, ω         | speed (signed: + clockwise)       | rad/s     | `speed{k}`, `speedRpm{k}`   |
| T_in, T_out  | torque (extension)                | N·m       | `inputTorque`, `torque{k}`  |
| T1, T2, r, v | belt tensions, radius, belt speed | N, m, m/s | `beltTight`, `beltSlack`    |
| n, MA, VR, η | rope segments, MA, VR, efficiency | —         | `liftSupports`, `liftMA` …  |

## 3. Governing equations

```text
(1) G = T_driven/T_driver (gears, sprockets); G = D_driven/D_driver (belts)
(2) N_out = N_in/G;  compound train: G = ΠG_i;  wheels on one shaft share N
(3) direction: gear −1 (with idler +1); open belt, chain +1; crossed belt −1
(4) T_out = η·G·T_in   (extension)
(5) belt: T = (T1 − T2)·r;  v = ω·r;  P = (T1 − T2)·v
(6) lifting: MA = load/effort; VR = effort distance/load distance = n; η = MA/VR
```

State `[θ0]`, dθ0/dt = ω_in. Shaft k angle θk = θ0·ωk/ω_in.

## 4. Assumptions

As listed in `transmissionModel.assumptions`.

## 5. Limitations

No slip, backlash, belt stretch or inertia; belt length, slip and tension ratio e^(μθ) are
beyond the syllabus. Gear geometry (module, centre distance) is not modelled.

## 6. Parameters and valid ranges

Input speed 0–400 rad/s; torque 0–1000 N·m; teeth 6–200 (whole); diameters 10–1000 mm;
stage efficiency 0.5–1; belt tensions 0–20 kN with T1 ≥ T2; radii 5–500 mm; rope segments 1–8
(whole); load 0.1 N–100 kN; rise 0.01–100 m; pulley efficiency 0.3–1. Warning: belt ratio
beyond 3:1.

## 7. Numerical method

The state is integrated exactly (constant ω). Fastest time constant 1/max|ω| (1 s at rest), so
each step turns the fastest shaft at most 0.1 rad for a smooth animation.

## 8. Outputs

Per shaft: `speed{k}`, `speedRpm{k}`, `angle{k}`, `torque{k}`; per idler `idlerSpeedRpm{i}`,
`idlerAngle{i}`; `overallRatio`, `outputSpeedRpm`, `outputTorque`, `inputPower`, `outputPower`;
belt `beltTorqueDriver`, `beltTorqueDriven`, `beltSpeed`, `beltPower`; lifting `liftEffort`,
`liftMA`, `liftVR`, `liftEfficiency`, `liftEffortDistance`.

## 9. Verification

| Case      | Expected                                          | Test file                              |
| --------- | ------------------------------------------------- | -------------------------------------- |
| RC-M06-01 | 240, 20, 25, 100, 40 rpm; G 2                     | `tests/reference/transmission.test.ts` |
| RC-M06-02 | 5.25, 342.857 ACW, 114.286 CW; 90, 360 CW; 0.0875 | same                                   |
| RC-M06-03 | 300 rpm CW; 10 rpm; G 3; 30, 25, 33.3333 rpm CW   | same                                   |
| RC-M06-04 | MA/VR 2, 4, 6; 25 N; 31.25 N at 80 %              | same                                   |
| RC-M06-05 | 30 and 75 N·m; 6.28319 m/s; 1884.96 W             | same                                   |
| RC-M06-06 | 49.875 N·m; 52.5 N·m; 628.319 W in and out        | same                                   |

Invariant: with η = 1 input and output power are equal.

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 7 |
