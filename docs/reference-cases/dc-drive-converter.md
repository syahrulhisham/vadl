# Reference case RC-M01-02: converter-fed separately excited DC drive

| Field            | Value                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Module           | M01 – DC Motor Drives                                                                    |
| Source of case   | Course Tutorial 2 (DC drives) Q2, which reproduces Rashid, _Power Electronics_, Ex. 15.1 |
| Course alignment | Course notation: Vm = √2·Vrms, Eg = Kv·If·ω, Td = Kv·If·Ia (LN Ch1 Part II p15, p28)     |
| Worked by        | Hand calculation, 15 November 2026                                                       |
| Status           | Test: `tests/reference/dc-motor.test.ts`                                                 |

## Given

Single-phase full converters for armature and field; supply 440 V rms, 60 Hz; Ra = 0.25 Ω;
Rf = 175 Ω; Kv = 1.4 V/(A·rad/s); field converter at maximum output (αf = 0°); armature firing
angle αa = 60°; armature current Ia = 45 A, continuous and ripple-free.

## Working

1. Vm = √2 × 440 = **622.254 V**.
2. Field: Vf = (2Vm/π)·cos 0° = **396.139 V**; If = Vf/Rf = 396.139/175 = **2.26365 A**.
3. Torque: Td = Kv·If·Ia = 1.4 × 2.26365 × 45 = **142.610 N·m**.
4. Armature: Va = (2Vm/π)·cos 60° = **198.070 V**.
5. Back-emf: Eg = Va − Ia·Ra = 198.070 − 11.25 = **186.820 V**.
6. Speed: ω = Eg/(Kv·If) = 186.820/3.16911 = **58.9501 rad/s** = **562.93 rpm**.
7. Input power: Pi = Va·Ia + Vf·If = 8913.13 + 896.72 = **9809.85 W**.

The course answer scheme agrees within rounding (it rounds If to 2.26 A, giving 142.4 N·m and
59.05 rad/s).

## Tolerances

Relative 1e−5 on every value (exact arithmetic; literals rounded to 6 significant figures).
The dynamic model with the same supply and a load torque of 142.610 N·m must settle to
Ia = 45 A and ω = 58.9501 rad/s within relative 1e−4.
