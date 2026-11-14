# Simulation model: <model name>

<!--
Copy this file to docs/simulation-models/<module-id>-<model>.md before writing the model code.
Every section is required. Delete these comments when done.
-->

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Model id         | `<module>.<model>` (matches `SimModel.id`)                             |
| Module           | Mxx – <title>                                                          |
| Model class      | dynamic / static / logic                                               |
| Source files     | `src/sim-core/equations/<domain>.ts`, `src/sim-core/models/<model>.ts` |
| Reference cases  | `docs/reference-cases/<case>.md`                                       |
| Status           | draft / reviewed by <name, date>                                       |
| Course alignment | provisional (D2) / checked against <material, page>                    |

## 1. Purpose

What the student should learn from this model, in two or three sentences.

## 2. Symbols and units

| Symbol | Quantity | SI unit | Code name |
| ------ | -------- | ------- | --------- |
|        |          |         |           |

## 3. Governing equations

State each equation, numbered, with its source (textbook, lecture notes page).

```latex
(1) ...
```

For dynamic models, give the state vector, its order in code (`stateLabels`), and the state
equations dS/dt = f(t, S, P).

## 4. Assumptions

Numbered list. These strings are shown on screen and in the report (`assumptions`).

## 5. Limitations

What the model cannot show, and when its results stop being meaningful. Be explicit that it is a
simplified educational model.

## 6. Parameters and valid ranges

| Parameter | Default | Min | Max | Reason for limits | Validation message if violated |
| --------- | ------- | --- | --- | ----------------- | ------------------------------ |
|           |         |     |     |                   |                                |

## 7. Numerical method

Integrator (RK4 default), step-size rule (Δt ≤ τ_min / 10), fastest time constant expression,
initial conditions. Static and logic models: state "not applicable" and why.

## 8. Outputs

| Output key | Quantity | Equation | SI unit | Display unit | Significant figures |
| ---------- | -------- | -------- | ------- | ------------ | ------------------- |
|            |          |          |         |              |                     |

## 9. Verification

| Case | Reference document | Expected | Tolerance | Test file |
| ---- | ------------------ | -------- | --------- | --------- |
|      |                    |          |           |           |

Physical invariants checked (for example power balance, energy conservation, slip range).

## 10. Change log

| Date | Change | By  |
| ---- | ------ | --- |
