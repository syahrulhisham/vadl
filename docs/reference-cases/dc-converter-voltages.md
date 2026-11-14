# Reference case RC-M01-04: average output of controlled converters

| Field            | Value                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Module           | M01 (converter-fed drives) and M03 (Lab 1)                                                  |
| Source of case   | Course formulas, LN Ch1 Part II p21–30 and Part III p6–11; Lab 1 supply voltages and angles |
| Course alignment | Vm = √2·Vrms for single-phase; Vm = peak **phase** voltage for three-phase                  |
| Worked by        | Hand calculation, 15 November 2026                                                          |
| Status           | Test: `tests/reference/dc-converters.test.ts`                                               |

## Formulas (continuous armature current)

| Converter             | Average output                    |
| --------------------- | --------------------------------- |
| 1-φ half-wave         | (Vm/2π)(1 + cos α)                |
| 1-φ semi              | (Vm/π)(1 + cos α)                 |
| 1-φ full              | (2Vm/π) cos α                     |
| 1-φ dual, converter 2 | −(2Vm/π) cos α2, with α1 + α2 = π |
| 3-φ half-wave         | (3√3·Vm/2π) cos α                 |
| 3-φ semi              | (3√3·Vm/2π)(1 + cos α)            |
| 3-φ full              | (3√3·Vm/π) cos α                  |

## Single-phase, 240 V rms (Vm = 339.411 V)

| α    | Half-wave (V) | Semi (V) | Full (V) |
| ---- | ------------- | -------- | -------- |
| 0°   | 108.038       | 216.076  | 216.076  |
| 30°  | 100.801       | 201.602  | 187.127  |
| 60°  | 81.0285       | 162.057  | 108.038  |
| 90°  | 54.0190       | 108.038  | 0        |
| 120° | 27.0095       | 54.0190  | −108.038 |
| 150° | 7.23718       | 14.4743  | −187.127 |
| 180° | 0             | 0        | −216.076 |

Uncontrolled (α = 0) at 120 / 220 V: half-wave 54.0190 / 99.0348 V; full-wave 108.038 / 198.070 V.

Dual converter: converter 1 at α1 = 30° gives 187.127 V; converter 2 at α2 = 150° gives
−(2Vm/π)·cos 150° = **+187.127 V**, the same average, as required for circulating-current-free
operation.

## Three-phase, 400 V line (peak phase Vm = 326.599 V)

- Full, α = 0°: 3√3·Vm/π = **540.190 V** (= 1.3505·VLL; the "1.35·VLL" rule gives 540 V).
- Full, α = 45°: **381.972 V**.
- Half-wave, α = 0°: **270.095 V**.
- Semi, α = 60°: (3√3·Vm/2π)(1.5) = **405.142 V**.

## Tolerances

Absolute 1e−3 V (literals rounded to 6 significant figures).
