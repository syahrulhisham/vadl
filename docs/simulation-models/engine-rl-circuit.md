# Simulation model: first-order RL circuit

| Field            | Value                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| Model id         | `engine.rl-circuit`                                                                 |
| Module           | Engine proving model (Milestone 3), shown under Learning resources                  |
| Model class      | dynamic                                                                             |
| Source files     | `src/sim-core/equations/circuits.ts`, `src/sim-core/models/rlCircuit.ts`            |
| Reference cases  | `docs/reference-cases/rl-circuit-step.md` (RC-ENG-01)                               |
| Status           | draft, verified by automated tests                                                  |
| Course alignment | Same form as the DC motor armature equation Va = Eg + Ia·Ra + La·dIa/dt with Eg = 0 |

## 1. Purpose

Shows how current builds up in an inductive circuit after a step of voltage, and what the time
constant L/R means. It proves the simulation engine end to end before the DC motor laboratory,
whose armature circuit has the same form.

## 2. Symbols and units

| Symbol | Quantity              | SI unit | Code name         |
| ------ | --------------------- | ------- | ----------------- |
| V      | Supply voltage (step) | V       | `voltage`         |
| R      | Resistance            | Ω       | `resistance`      |
| L      | Inductance            | H       | `inductance`      |
| i      | Current               | A       | state `[0]`       |
| τ      | Time constant L/R     | s       | `timeConstant`    |
| v_R    | Resistor voltage R·i  | V       | `resistorVoltage` |
| v_L    | Inductor voltage      | V       | `inductorVoltage` |

## 3. Governing equations

```latex
(1)\; L\frac{di}{dt} = V - R\,i \qquad (2)\; v_R = R\,i \qquad (3)\; v_L = V - R\,i \qquad (4)\; \tau = L/R
```

State vector: `[i]` (`stateLabels = ['i [A]']`). Derivative: di/dt = (V − R·i)/L.

## 4. Assumptions

1. Ideal DC voltage source with no internal resistance; the switch closes at t = 0.
2. Linear resistor and inductor with constant values; the inductor's own resistance is included in R.
3. No capacitance or other parasitic elements.

## 5. Limitations

A simplified educational model. It does not show saturation of an iron-cored inductor, switch
arcing when the circuit is opened, or temperature effects on resistance.

## 6. Parameters and valid ranges

| Parameter | Default | Min   | Max  | Reason for limits                               | Validation message if violated                                                           |
| --------- | ------- | ----- | ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| V         | 10 V    | 0     | 250  | Bench supply range; 0 V shows no transient      | "Supply voltage must be between 0 and 250 V."                                            |
| R         | 10 Ω    | 0.1   | 1000 | R = 0 gives an infinite final current and τ = ∞ | "Resistance must be greater than zero: with R = 0 the current would rise without limit." |
| L         | 0.1 H   | 0.001 | 10   | L = 0 removes the transient (τ = 0)             | "Inductance must be greater than zero: with L = 0 the current would change instantly."   |

## 7. Numerical method

RK4 by default, Euler selectable. The fastest time constant is τ = L/R; the runner keeps
Δt ≤ τ/10. Initial condition i(0) = 0.

## 8. Outputs

| Output key        | Quantity | Equation | SI unit | Display unit | Significant figures |
| ----------------- | -------- | -------- | ------- | ------------ | ------------------- |
| `current`         | i        | state    | A       | A            | 4                   |
| `resistorVoltage` | v_R      | (2)      | V       | V            | 4                   |
| `inductorVoltage` | v_L      | (3)      | V       | V            | 4                   |
| `finalCurrent`    | I∞ = V/R | —        | A       | A            | 4                   |
| `timeConstant`    | τ        | (4)      | s       | ms           | 4                   |
| `fractionOfFinal` | i/I∞     | —        | 1       | %            | 4                   |

## 9. Verification

| Case      | Reference document   | Expected          | Tolerance    | Test file                            |
| --------- | -------------------- | ----------------- | ------------ | ------------------------------------ |
| RC-ENG-01 | `rl-circuit-step.md` | i(τ) = 0.632121 A | 1e−6 A (RK4) | `tests/reference/rl-circuit.test.ts` |

Invariants checked: v_R + v_L = V at every step; the current never exceeds V/R for a rising
step; integrated source energy equals resistor energy plus stored energy.

## 10. Change log

| Date        | Change        | By     |
| ----------- | ------------- | ------ |
| 14 Nov 2026 | First version | Claude |
