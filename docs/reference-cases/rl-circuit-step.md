# Reference case RC-ENG-01: first-order RL circuit, step response

| Field            | Value                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Module           | Engine proving model (Milestone 3); the same physics is the DC motor armature circuit (M01)                       |
| Model            | `engine.rl-circuit`                                                                                               |
| Source of case   | Project plan section 7 ("current = 63.21 % of final value at one time constant")                                  |
| Course alignment | Standard first-order circuit result; the course's DC analysis is steady state, so no course worked example exists |
| Worked by        | Hand calculation, 14 November 2026                                                                                |
| Status           | Test written: `tests/reference/rl-circuit.test.ts`                                                                |

## 1. Given

| Symbol | Quantity            | Value | Unit |
| ------ | ------------------- | ----- | ---- |
| V      | Step supply voltage | 10    | V    |
| R      | Resistance          | 10    | Ω    |
| L      | Inductance          | 0.1   | H    |
| i(0)   | Initial current     | 0     | A    |

## 2. Model

Kirchhoff's voltage law around the loop, with the switch closed at t = 0:

```latex
V = R\,i + L\frac{di}{dt}
```

Solution with i(0) = 0:

```latex
i(t) = \frac{V}{R}\left(1 - e^{-t/\tau}\right), \qquad \tau = \frac{L}{R}
```

## 3. Working

- Time constant τ = L/R = 0.1 / 10 = **0.01 s** (10 ms).
- Final current I∞ = V/R = 10 / 10 = **1 A**.
- e^(−1) = 0.367 879 44, so at t = τ: i = 1 × (1 − 0.367 879 44) = **0.632 121 A** (63.21 %).
- At t = 2τ: 1 − e^(−2) = **0.864 665 A**.
- At t = 3τ: 1 − e^(−3) = **0.950 213 A**.
- At t = 5τ: 1 − e^(−5) = **0.993 262 A**.
- At t = τ the resistor voltage is R·i = **6.321 21 V** and the inductor voltage is
  V − R·i = **3.678 79 V**; they sum to the supply, 10 V.
- Initial rate of rise: di/dt(0) = V/L = **100 A/s**.
- Energy check over the transient: energy delivered by the source equals energy dissipated in
  R plus energy stored in L. At steady state the stored energy is ½·L·I∞² = **0.05 J**.

## 4. Expected results and tolerances

| Quantity       | Expected             | Tolerance (RK4, Δt = τ/10) | Tolerance (Euler, Δt = τ/1000) | Reason                                           |
| -------------- | -------------------- | -------------------------- | ------------------------------ | ------------------------------------------------ |
| τ              | 0.01 s               | exact (1e−12 s)            | —                              | Algebraic                                        |
| i(τ)           | 0.632121 A           | absolute 1e−6 A            | absolute 5e−4 A                | Literal rounded to 6 decimals; integration error |
| i(2τ)          | 0.864665 A           | absolute 1e−6 A            | —                              |                                                  |
| i(3τ)          | 0.950213 A           | absolute 1e−6 A            | —                              |                                                  |
| i(5τ)          | 0.993262 A           | absolute 1e−6 A            | —                              |                                                  |
| v_R(τ), v_L(τ) | 6.32121 V, 3.67879 V | absolute 1e−5 V            | —                              |                                                  |
| di/dt(0)       | 100 A/s              | exact                      | —                              | Derivative function at the initial state         |
| ½·L·I∞²        | 0.05 J               | exact                      | —                              | Algebraic                                        |

The RK4 tolerance follows from its local error O(Δt⁵): with Δt = τ/10 the global error is of
order 1e−7 A, comfortably inside 1e−6 A. Forward Euler is first order; at Δt = τ/1000 its error
at t = τ is about 1.8e−4 A, inside 5e−4 A.

## 5. Independent check

The values are the standard first-order step response, e.g. 63.2 %, 86.5 %, 95.0 % and 99.3 % at
one, two, three and five time constants, as tabulated in introductory circuit-analysis texts.
