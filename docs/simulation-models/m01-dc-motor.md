# Simulation model: DC motor and DC drive

| Field            | Value                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Model id         | `m01.dc-motor`                                                                                                                                  |
| Module           | M01 – DC Motor Drives                                                                                                                           |
| Model class      | dynamic                                                                                                                                         |
| Source files     | `src/sim-core/equations/dcMachines.ts`, `equations/converters.ts`, `models/dcMotor.ts`                                                          |
| Reference cases  | RC-M01-01 `dc-motor-steady-state.md`; RC-M01-02 `dc-drive-converter.md`; RC-M01-03/05 `dc-motor-other.md`; RC-M01-04 `dc-converter-voltages.md` |
| Status           | draft, verified by automated tests; awaiting lecturer review                                                                                    |
| Course alignment | Notation of LN Ch1 Parts II–III and Tutorials 1–2 (`docs/course-alignment.md` §4, §5.1)                                                         |

## 1. Purpose

Lets students start, load and control separately excited, shunt and series DC motors, from a DC
supply or from phase-controlled converters, and connect the course's steady-state equations to
what happens during starting and load changes.

## 2. Symbols and units

| Symbol       | Quantity                                   | SI unit          | Code name                                                       |
| ------------ | ------------------------------------------ | ---------------- | --------------------------------------------------------------- |
| Va           | Armature terminal voltage (average)        | V                | `armatureVoltage` (param / output)                              |
| Vf, If       | Field voltage, field current               | V, A             | `fieldVoltage`, `fieldCurrent`                                  |
| Vs, Vm       | Converter supply rms, peak (phase for 3-φ) | V                | `supplyRms`                                                     |
| αa, αf       | Armature, field firing angles              | rad              | `alphaArmature`, `alphaField`                                   |
| Ra, La       | Armature resistance, inductance            | Ω, H             | `ra`, `la`                                                      |
| Rf           | Field resistance                           | Ω                | `rf`                                                            |
| Kv           | Motor constant                             | V/(A·rad/s)      | `kv`                                                            |
| Kaf          | Series constant (linear magnetics)         | H                | `kaf`                                                           |
| Rs, Ls       | Series field resistance, inductance        | Ω, H             | `rs`, `ls`                                                      |
| Rst          | Starting resistance                        | Ω                | `rst`                                                           |
| J, B         | Inertia, viscous friction                  | kg·m², N·m·s/rad | `inertia`, `friction`                                           |
| C, Tr, nr, k | Load law T = C·Tr·(n/nr)^k                 | —, N·m, rpm, —   | `loadC`, `loadRatedTorque`, `loadRatedSpeedRpm`, `loadExponent` |
| Ia, ω        | Armature current, speed (state)            | A, rad/s         | state `[0]`, `[1]`                                              |
| Eg, Td, TL   | Back-emf, developed torque, load torque    | V, N·m           | `backEmf`, `torque`, `loadTorque`                               |

## 3. Governing equations

```latex
(1)\; V_a = E_g + I_a R + L \frac{dI_a}{dt}, \quad R = R_a + R_{st} \,[+R_s], \; L = L_a \,[+L_s]
(2)\; J\frac{d\omega}{dt} = T_d - T_L - B\omega
(3)\; \text{Separately excited, shunt: } E_g = K_v I_f \omega, \; T_d = K_v I_f I_a, \; I_f = V_f/R_f
(4)\; \text{Shunt: } V_f = V_a \qquad \text{Series: } E_g = K_{af} I_a \omega, \; T_d = K_{af} I_a^2
(5)\; T_L = C\,T_r\,(n/n_r)^k, \; k \in \{-1, 0, 1, 2\}
(6)\; \text{Converter averages: see RC-M01-04}
```

At steady state (dIa/dt = 0, dω/dt = 0, B = 0) equation (1) becomes the course's Eg = Va − Ia·Ra
and (2) becomes Td = TL. State vector `[Ia, ω]`.

## 4. Assumptions

Shown on screen and in the report (`dcMotorModel.assumptions`):

1. Linear magnetic circuit (no saturation).
2. No armature reaction, brush drop or commutation effects.
3. Field winding time constant neglected.
4. Converters as average output with continuous conduction.
5. Single-quadrant converters block negative current (state held at Ia = 0).
6. Ideal DC supply; mechanical losses are B·ω and the load law only.
7. Simplified educational model.

## 5. Limitations

No ripple, discontinuous conduction or harmonic effects of converters; no saturation, so a weak
field or a series motor at high current is idealised; series motor at light load accelerates
without limit (as a real one would, until damaged) — the model warns. The load is passive
(opposes motion); overhauling loads such as a descending hoist are not modelled.

## 6. Parameters and valid ranges

See `DC_LIMITS` in `models/dcMotor.ts`. Each violation is refused with a message naming the
range; a zero field current is refused with an explanation; a nearly unloaded series motor gives a
warning. Presets: separately excited (RC-M01-01), shunt, series (RC-M01-05), converter-fed
(RC-M01-02). Machine values are textbook-typical until UTeM bench data are supplied (D4).

## 7. Numerical method

RK4 by default. Fastest time constant = min(L/R, J·R/K², J/B), with K = Kv·If, or for the series
motor K = Kaf·Va/R (the largest flux the current can produce, so the step is safe at stall).
Δt ≤ τ_min/10. Initial state at rest, Ia = 0, ω = 0.

## 8. Outputs

`armatureCurrent`, `speed`, `speedRpm`, `backEmf`, `armatureVoltage`, `fieldCurrent`,
`fieldVoltage`, `torque`, `loadTorque`, `inputPower` (armature + field), `outputPower` (TL·ω),
`copperLoss`, `efficiency`, `conductionBlocked`.

## 9. Verification

| Case      | Expected                                                               | Test file                                                      |
| --------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| RC-M01-01 | Ia 20 A, ω 175 rad/s, η 95.45 % (armature), 90.91 % overall            | `tests/reference/dc-motor.test.ts`, `dc-motor-dynamic.test.ts` |
| RC-M01-02 | Ia 45 A, ω 58.9501 rad/s, Pi 9809.85 W                                 | both files above                                               |
| RC-M01-03 | Tutorial 1 Q6–Q9                                                       | `tests/reference/dc-motor.test.ts`                             |
| RC-M01-04 | Converter averages                                                     | `tests/reference/dc-converters.test.ts`                        |
| RC-M01-05 | Starting resistance, field weakening, series motor, load law, friction | both motor files                                               |

Invariants: single-quadrant current never negative; passive load holds the shaft at standstill;
reversal with negative Va.

## 10. Change log

| Date        | Change        | By     |
| ----------- | ------------- | ------ |
| 15 Nov 2026 | First version | Claude |
