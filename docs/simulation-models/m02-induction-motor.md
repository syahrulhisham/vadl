# Simulation model: three-phase induction motor drive

| Field            | Value                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Model id         | `m02.induction-motor`                                                                 |
| Module           | M02 – AC Motor Drives                                                                 |
| Model class      | dynamic (rotor speed and slip angle)                                                  |
| Source files     | `src/sim-core/equations/inductionMachine.ts`, `src/sim-core/models/inductionMotor.ts` |
| Reference cases  | `docs/reference-cases/ac-motor.md` (RC-M02-01 to -05)                                 |
| Status           | draft, verified by automated tests; awaiting lecturer review                          |
| Course alignment | Approximate equivalent circuit, per-phase Vs, mechanical ωs ("AC Drives new" p3–21)   |

## 1. Purpose

Lets students see how slip, torque, current, power factor and efficiency follow from the
equivalent circuit, and compare the speed-control methods taught: stator voltage, rotor
resistance, constant V/f, and frequency at constant voltage (above base).

## 2. Equations

Ns = 120f/p; ωs = 4πf/p; S = (ωs − ωm)/ωs; fr = S·f.
Ir' = Vs/√[(Rs + Rr'/S)² + (Xs + Xr')²]; Zi = jXm ∥ (Rs + Rr'/S + j(Xs + Xr')).
Pg = 3Ir'²Rr'/S; Td = Pg/ωs; Pd = Pg(1 − S); Pscu = 3Ir'²Rs; Prcu = S·Pg.
Smax, Tmax, Tst as in RC-M02. Reactances ∝ f. State equations:
J·dωm/dt = Td − TL − B·ωm; dθslip/dt = ωs − ωm (wrapped to 0…2π).

Supply by control method: DOL (rated V, f); stator voltage (Vs = b·Vrated); rotor resistance
(Rr' + Rx'); V/f (Vs = Vrated·f/frated); frequency (Vs = Vrated, f variable, warns below rated f).

## 3. Assumptions and limitations

See `inductionMotorModel.assumptions` (shown on screen and in reports): approximate circuit,
no electrical transients, balanced sinusoidal supply, constant parameters (no saturation or skin
effect), no V/f boost, wound rotor for rotor-resistance control. Starting current is the
steady-state circuit value at S = 1 (no DC offset or transient).

## 4. Numerical method

RK4. Fastest time constant J/(3Vs²/(ωs²Rr') + B), the steepest torque–speed slope near
synchronous speed; Δt ≤ one tenth of it.

## 5. Verification

RC-M02-01 performance (Zi, Is, PF, Pg, Td, Pin, Tmax, Tst; dynamic settling to 1750 rpm and
η 92.273 % with the 60 W no-load loss as B·ω); RC-M02-02 V/f; RC-M02-03 stator voltage
(dynamic settling to 1550 rpm); RC-M02-04 basics and rotor resistance (settling to 1700 rpm);
RC-M02-05 frequency control above base (corrected values). Invariants: Pin = Pg + Pscu,
Pg = Pd + Prcu; torque zero at synchronous speed and negative above it; a motor cannot start a
load above Tst. Files: `tests/reference/ac-motor.test.ts`, `tests/unit/sim-core/inductionMotor.test.ts`.
