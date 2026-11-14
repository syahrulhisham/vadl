# Reference cases RC-M01-03 and RC-M01-05: DC motor fundamentals, series motor, field control

| Field            | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Module           | M01 – DC Motor Drives                                                 |
| Source of case   | RC-M01-03: course Tutorial 1 Q6–Q9. RC-M01-05: VADL cases worked here |
| Course alignment | Tutorial 1 notation: Vg = kΦ·ω, T = kΦ·Ia, P = 2πNT/60                |
| Worked by        | Hand calculation, 15 November 2026                                    |
| Status           | Test: `tests/reference/dc-motor.test.ts`                              |

## RC-M01-03 (course Tutorial 1)

| Q   | Given                                                                                               | Working                                                                                 | Result                          |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| 6   | Series motor, 500 V, 10 kW output, 1200 rpm, η = 92 %                                               | Pin = 10 000/0.92 = 10 869.6 W; Ia = Pin/V; T = P/(2πN/60)                              | Ia = 21.7391 A; T = 79.5775 N·m |
| 7   | Series motor, Ra = 0.5 Ω, Rf = 1 Ω, 300 V; 50 A at 1000 rpm with Φ = 0.03 Wb; new 25 A, Φ = 0.02 Wb | Eg1 = 300 − 50 × 1.5 = 225 V; Eg2 = 300 − 25 × 1.5 = 262.5 V; N2 = N1·(Eg2/Eg1)·(Φ1/Φ2) | N2 = 1750 rpm                   |
| 8   | Lossless motor, 500 V at base speed 1500 rpm, 300 N·m                                               | kΦ = 500/(1500 × 2π/60) = 3.18310 V·s/rad; Ia = T/kΦ                                    | Ia = 94.2478 A                  |
| 9   | Field weakened to reach 3000 rpm at 500 V, same Ia                                                  | kΦ = 500/(3000 × 2π/60) = 1.59155; T = kΦ·Ia                                            | T = 150.000 N·m                 |

## RC-M01-05 (VADL cases)

**Starting current and starting resistance.** Va = 220 V, Ra = 0.5 Ω, motor at rest (Eg = 0):
Ia = 220/0.5 = **440 A**. To limit starting current to 40 A, the total resistance must be
220/40 = 5.5 Ω, so the starting resistor is **Rst = 5.0 Ω**.

**Field weakening.** Va = 220 V, Ra = 0.5 Ω, Kv = 1.2, If reduced to 0.5 A (Kv·If = 0.6), load
12 N·m, B = 0: Ia = 12/0.6 = **20 A**; ω = (220 − 20 × 0.5)/0.6 = **350 rad/s** = **3342.25 rpm**.
Halving the field doubles the no-load speed and halves the torque per ampere.

**Series motor, linear magnetic circuit.** Eg = Kaf·Ia·ω, Td = Kaf·Ia². Kaf = 0.04 H,
Va = 220 V, Ra = 0.3 Ω, series field Rs = 0.2 Ω, TL = 40 N·m, B = 0:
Ia = √(40/0.04) = **31.6228 A**; Eg = 220 − 31.6228 × 0.5 = **204.189 V**;
ω = Eg/(Kaf·Ia) = **161.425 rad/s** = **1541.50 rpm**; Pin = 6957.01 W; Pout = 6457.01 W;
η = **92.813 %** (the difference is the copper loss Ia²·(Ra + Rs) = 500 W).

**Load-torque law** T = C·Tr·(n/nr)^k with C = 1, Tr = 24 N·m, nr = 1500 rpm, at n = 1000 rpm:
k = 0 → **24 N·m**; k = 1 → **16 N·m**; k = 2 → **10.6667 N·m**; k = −1 → **36 N·m**.

**Viscous friction.** RC-M01-01 with B = 0.01 N·m·s/rad: K·Ia = TL + B·ω and Va = K·ω + Ra·Ia give
ω = (Va − Ra·TL/K)/(K + Ra·B/K) = **174.394 rad/s** and Ia = **21.4533 A**.

## Tolerances

Relative 1e−5 for algebraic values. Dynamic settling: relative 1e−4 after 20 of the slowest time
constants.
