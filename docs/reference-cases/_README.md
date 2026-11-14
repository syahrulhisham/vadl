# Reference cases

Each file here is a hand calculation, worked independently of the code, that one or more
automated tests check against. Rules:

1. Write the case **before** the test and before (or independently of) the code.
2. Show every step with units; state the rounding used for each result.
3. State the tolerance the test will use and why.
4. Tests copy the expected values here as **literal numbers**. They never recompute the
   expected value with the formula under test.
5. Course worked examples (listed in `docs/course-alignment.md` §6) become additional cases and
   take priority.

`dc-motor-steady-state.md` is the worked template for every later case.

| Case                                                                   | Module | Status                                                                         | Test                                    |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ | --------------------------------------- |
| [DC motor, separately excited, steady state](dc-motor-steady-state.md) | M01    | Hand calculation done; test written in Milestone 4 with the equation functions | `tests/reference/dc-motor.test.ts` (M4) |
| [RL circuit step response (RC-ENG-01)](rl-circuit-step.md)             | Engine | Hand calculation done; test passing                                            | `tests/reference/rl-circuit.test.ts`    |

Of the values in that case, only the rad/s ↔ rpm conversion (175 rad/s = 1671.127 rpm) is already
tested in Milestone 1, in `tests/unit/sim-core/units.test.ts`.
