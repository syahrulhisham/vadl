# Reference cases RC-M03-01 to RC-M03-04: power converters

| Field            | Value                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| Module           | M03 – Power Converters                                                                 |
| Source of case   | Course Lab 1 settings; LN Ch1 Part I (rectifier performance, choppers); project plan   |
| Course alignment | Vm = √2·Vrms; R-load formulas for Lab 1; continuous-current formula for inductive load |
| Worked by        | Hand calculation, 15 November 2026                                                     |
| Status           | Tests: `tests/reference/power-converters.test.ts`                                      |

## RC-M03-01 — Lab 1, resistive load, 240 V rms (Vm = 339.411 V)

Averages are in RC-M01-04. RMS values:

- Half-wave diode: Vrms = Vm/2 = **169.706 V**. Full-wave bridge: Vrms = Vm/√2 = **240.000 V**.
- Half-wave thyristor: Vrms = (Vm/2)·√[(π − α + ½ sin 2α)/π].
- Full thyristor bridge (R load): Vrms = (Vm/√2)·√[(π − α + ½ sin 2α)/π].

| α    | Half-wave thyristor Vrms (V) | Full bridge Vrms (V) |
| ---- | ---------------------------- | -------------------- |
| 0°   | 169.706                      | 240.000              |
| 30°  | 167.241                      | 236.515              |
| 60°  | 152.216                      | 215.265              |
| 90°  | 120.000                      | 169.706              |
| 120° | 75.0362                      | 106.117              |
| 150° | 28.8172                      | 40.7537              |
| 180° | 0                            | 0                    |

Rectifier performance (R load): full wave form factor **1.11072**, ripple factor **0.48343**,
rectification efficiency 8/π² = **0.810569**; half wave form factor **1.57080**, ripple factor
**1.21136**, efficiency 4/π² = **0.405285**. Course Exercise 1 (340 V, 240 Ω): Vo,avg
**306.108 V**, Io **1.27545 A**. With a resistive load the input power factor is 1 for the
full-wave bridge (the course slide's "PF = 8" is the error recorded in course-alignment §7).

## RC-M03-02 — three-phase full bridge, inductive load

400 V line, α = 30°: Vo = (3√3·Vm/π)·cos α = 540.190 × 0.866025 = **467.818 V**.

## RC-M03-03 — DC-DC converters (ideal, continuous conduction, L = 1 mH, fs = 20 kHz)

| Converter  | Given                             | Results                                                                                                                                  |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Buck       | Vin 48 V, D 0.4, R 10 Ω, C 100 µF | Vo **19.2 V**; IL **1.92 A**; ΔI **0.576 A**; Imax **2.208 A**, Imin **1.632 A**; Lmin **150 µH**; ΔVC = ΔI/(8fC) **0.036 V**            |
| Boost      | Vin 12 V, D 0.6, R 20 Ω, C 470 µF | Vo **30 V**; IL = Vin/[(1−D)²R] **3.75 A**; ΔI = Vin·D/(Lf) **0.36 A**; Lmin = D(1−D)²R/(2f) **48 µH**; ΔVo = Vo·D/(RCf) **0.0957447 V** |
| Buck-boost | Vin 24 V, D 0.6, R 20 Ω           | Vo **−36 V**; IL = Vin·D/[R(1−D)²] **4.5 A**; ΔI **0.72 A**; Lmin = (1−D)²R/(2f) **80 µH**                                               |

## RC-M03-04 — inverters

- Single-phase full bridge, square wave, Vdc = 200 V: output rms **200 V**; fundamental rms
  4Vdc/(π√2) = **180.063 V**; THD **48.3426 %**.
- Single-phase bipolar sinusoidal PWM, ma = 0.8, Vdc = 200 V: fundamental peak ma·Vdc = **160 V**
  (rms **113.137 V**), linear region (ma ≤ 1).
- Three-phase six-step, Vdc = 600 V: line rms √(2/3)·Vdc = **489.898 V**; line fundamental rms
  (√6/π)·Vdc = **467.818 V**; THD **31.0842 %**.
- Three-phase sinusoidal PWM, ma = 0.8, Vdc = 600 V: line fundamental peak (√3/2)·ma·Vdc =
  **415.692 V** (rms **293.939 V**).

## Tolerances

Closed-form functions: relative 1e−5. Numerically integrated waveform statistics (2000+ samples
per period): relative 1e−3 for averages and rms; 1 % for PWM fundamentals (sideband content
depends on the frequency ratio mf; tests use mf = 21).
