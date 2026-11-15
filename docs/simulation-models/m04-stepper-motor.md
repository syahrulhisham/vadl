# Simulation model: stepper motor

| Field            | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Model id         | `m04.stepper-motor`                                                        |
| Module           | M04 – Stepper Motors                                                       |
| Model class      | dynamic (pulse logic in `project`, optional rotor dynamics)                |
| Source files     | `src/sim-core/equations/stepper.ts`, `src/sim-core/models/stepperMotor.ts` |
| Reference cases  | `docs/reference-cases/stepper-motor.md` (RC-M04-01 to -05)                 |
| Status           | draft, Milestone 6                                                         |
| Course alignment | LN Ch2 Part I p8, p14–15, p30–43; Tutorial 3; course-alignment §5.4 (L-15) |

## 1. Purpose

Show how a pulse train becomes discrete steps: step angle from the tooth counts, the phase
sequence for wave, normal and half-step drive in either direction, and the resulting position
and speed. The optional rotor dynamics show why a real motor oscillates at each step and can
lose steps.

## 2. Symbols and units

| Symbol | Quantity                                 | SI unit          | Code name                   |
| ------ | ---------------------------------------- | ---------------- | --------------------------- |
| Ns, Nr | stator poles, rotor teeth (VR)           | —                | `statorTeeth`, `rotorTeeth` |
| Sa     | full step angle                          | rad              | `fullStepAngle`             |
| m      | number of phases                         | —                | `phases`                    |
| PR     | pulse rate                               | pulses/s         | `pulseRate`                 |
| PPR    | pulses per revolution                    | —                | `ppr`                       |
| Ne     | electrical cycles per revolution         | —                | `ne`                        |
| Tpk    | peak torque of one phase                 | N·m              | `peakTorque`                |
| J, B   | inertia, viscous damping                 | kg·m², N·m·s/rad | `inertia`, `damping`        |
| TL     | load torque (against clockwise rotation) | N·m              | `loadTorque`                |

## 3. Governing equations

```text
(1) Sa = (Ns − Nr)/(Ns·Nr) × 360°           VR (course); two-phase: Sa = 360°/steps per rev
(2) m = Ns/(Ns − Nr)                          VR phases
(3) angle per pulse = Sa (wave, normal), Sa/2 (half), Sa/n (microstep)
(4) PPR = 360°/angle per pulse;  N = angle·PR/6 [rpm];  time per step = 1/PR
(5) detent of step k = k·(angle per pulse), + Sa/2 in normal (two-phase-on) drive
(6) T = −Tpk·Σ g(i_j)·sin(Ne·θ − ψ_j);  g(i) = i² (VR), i (bipolar)
(7) J·dω/dt = T − B·ω − TL;  dθ/dt = ω       (rotor dynamics only)
```

Ne = Nr for VR motors and 360°/(4·Sa) for two-phase motors; ψ_j = j·360°/m (VR) or 0°, 90°
(two-phase), electrical.

State vector `[q, k, n, θ, ω]`: q is the fraction of the pulse period elapsed (dq/dt = PR while
pulses remain), k the signed step index and n the pulse count. `project` turns q ≥ 1 into a
pulse: k ± 1, n + 1. With the ideal rotor, `project` also sets θ to the detent of step k.

## 4. Assumptions

As listed in `stepperMotorModel.assumptions` (shown on screen and in the report).

## 5. Limitations

- Ideal rotor by default: no missed steps or resonance (plan §5).
- The dynamic option has ideal current drive: the winding inductance and back-emf that make a
  real motor's torque fall with pulse rate are not modelled, so the pull-out curve the course
  shows qualitatively (LN p16–17) is not reproduced quantitatively.
- Torque, inertia and damping are typical assumed values (D4).
- Microstepping assumes a perfectly sinusoidal torque curve (equal microsteps).

## 6. Parameters and valid ranges

| Parameter     | Default (VR 6/4) | Min   | Max    | Reason                              | Message if violated                        |
| ------------- | ---------------- | ----- | ------ | ----------------------------------- | ------------------------------------------ |
| Ns, Nr        | 6, 4             | 3, 2  | 48, 50 | Drawable motors; course rules       | Ns = Nr, Ns < Nr, non-integer PPR, m ∉ 2…5 |
| steps per rev | 48 / 200         | 4     | 400    | Multiple of 4 for a two-phase motor | "whole multiple of 4"                      |
| PR            | 20 pulses/s      | 1     | 5000   | Course speeds up to about 4000 rpm  | range                                      |
| pulse limit   | 0 (continuous)   | 0     | 100000 | Whole number                        | range / whole number                       |
| Tpk           | 0.2 N·m          | 0.001 | 5      | Typical small steppers              | range                                      |
| J             | 2×10⁻⁵ kg·m²     | 1e−7  | 0.01   |                                     | range                                      |
| B             | 8×10⁻⁴           | 0     | 0.1    |                                     | range                                      |
| TL            | 0                | 0     | 5      | Warning if ≥ holding torque         | "cannot hold the load"                     |

Microstepping: two-phase bipolar motors only, 2/4/8/16 microsteps.

## 7. Numerical method

RK4. Fastest time constant: the pulse period 1/PR (ideal rotor), and also 1/ωn with
ωn = √(Ne·√2·Tpk/J) and J/B when the rotor dynamics are on. Δt = τ/10, so a pulse is at most
one tenth of a pulse period late. A loaded rotor starts at its load angle asin(TL/Thold)/Ne.

## 8. Outputs

`fullStepAngle`, `stepAngle`, `phases`, `ppr`, `pulseRate`, `stepTime`, `commandSpeed(Rpm)`,
`pulses`, `stepIndex`, `commandAngle(Deg)`, `rotorAngle(Deg)`, `rotorSpeed(Rpm)`,
`positionErrorDeg`, `lostSteps` (full steps slipped, from whole electrical cycles of error),
`motorTorque`, `pulsing`, phase currents `i0`…`i4`. Angles shown in degrees, speeds in rpm.

## 9. Verification

| Case      | Expected                                              | Tolerance | Test file                               |
| --------- | ----------------------------------------------------- | --------- | --------------------------------------- |
| RC-M04-01 | 30°/15°/15°, 750 rpm, 120 and 20 pulses/s; rejections | 1e−9      | `tests/reference/stepper-motor.test.ts` |
| RC-M04-02 | 150/75 rpm, 50/100 pulses, 1800°/900°, 1250 rpm       | 1e−9      | same                                    |
| RC-M04-03 | Lab sequence tables, CW and CCW; bipolar sequences    | exact     | same                                    |
| RC-M04-04 | −0.8 N·m/rad; −7.5°; 30° and 26.3806°                 | 0.05°     | same                                    |
| RC-M04-05 | 0.1125°, 3200 PPR, 60 rpm; 0.92388/0.38268            | 1e−5      | same                                    |

Invariant (unit tests): every step of every mode is a stable equilibrium of the torque law at
the detent angle of equation (5).

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 6 |
