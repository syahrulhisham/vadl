# Reference cases RC-M02-01 to RC-M02-05: three-phase induction motor

| Field            | Value                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Module           | M02 – AC Motor Drives                                                                        |
| Source of case   | Course AC tutorial Q1, Q2, Q4 (Rashid examples) and the frequency-control example, corrected |
| Course alignment | Approximate equivalent circuit with Xm at the terminals; per-phase Vs; ωs = 2ω/p mechanical  |
| Worked by        | Hand calculation, 15 November 2026                                                           |
| Status           | Tests: `tests/reference/ac-motor.test.ts`                                                    |

## Equations (course notation)

- Ns = 120f/p; ωs = 4πf/p; S = (Ns − N)/Ns; rotor frequency fr = S·f.
- Ir' = Vs / √[(Rs + Rr'/S)² + (Xs + Xr')²]; Zi = jXm ∥ (Rs + Rr'/S + j(Xs + Xr')).
- Pg = 3·Ir'²·Rr'/S; Td = Pg/ωs; Pd = Pg(1 − S); Pscu = 3·Ir'²·Rs (Rs carries Ir' in this circuit).
- Smax = Rr'/√[Rs² + (Xs + Xr')²]; Tmax = 3Vs²/{2ωs[Rs + √(Rs² + (Xs + Xr')²)]};
  Tst = 3Rr'Vs²/{ωs[(Rs + Rr')² + (Xs + Xr')²]}.
- Reactances scale with frequency: X = Xrated·(f/frated).

## RC-M02-01 — performance (AC tutorial Q1)

460 V Y, 60 Hz, 4 poles; Rs 0.42 Ω, Rr' 0.23 Ω, Xs = Xr' = 0.82 Ω, Xm 22 Ω; no-load loss
60 W; speed 1750 rpm.

- Vs = 460/√3 = **265.581 V**; ωs = **188.496 rad/s**; Ns = 1800 rpm; S = 50/1800 = **0.0277778**.
- Zi = **7.7321 Ω ∠ 30.88°**; Is = **34.348 A**; PF = **0.8582** lagging; Ir' = **29.998 A**.
- Pin = 3·Vs·Is·PF = **23 487.2 W** (= Pg + Pscu = 22 353.4 + 1133.9 W, check).
- Pg = **22 353.4 W**; Td = **118.588 N·m**; Pd = **21 732.4 W**.
- Pout = Pd − 60 = **21 672.4 W**; η = **92.273 %**.
- Smax = **0.135859**; Tmax = **265.644 N·m**; Tst = **82.964 N·m**.

The course answers (S rounded to 0.028: 118.4 N·m, 92 %) agree within 1 %.

## RC-M02-02 — constant V/f (AC tutorial Q4)

460 V Y, 60 Hz, 4 poles, Rs = 0, Rr' 0.38 Ω, Xs 1.14 Ω, Xr' 1.71 Ω, Xm 33.2 Ω.

| f     | Vs (V)  | ωs (rad/s) | Smax     | Tmax (N·m) | ωm at Tmax (rad/s) |
| ----- | ------- | ---------- | -------- | ---------- | ------------------ |
| 60 Hz | 265.581 | 188.496    | 0.133333 | 196.943    | 163.363            |
| 30 Hz | 132.791 | 94.2478    | 0.266667 | 196.943    | 69.1150            |

Maximum torque is unchanged when V/f is constant and Rs = 0. Course answers agree.

## RC-M02-03 — stator-voltage control (AC tutorial Q2)

460 V Y, 60 Hz, 4 poles; Rs 1.01, Rr' 0.69, Xs 1.3, Xr' 1.94 Ω; fan load TL ∝ n², 41 N·m at
1740 rpm. Required speed 1550 rpm:

- TL = 41·(1550/1740)² = **32.5349 N·m**; S = 250/1800 = **0.138889**.
- From Td = TL: Vs = **137.929 V** per phase, i.e. b = Vs/265.581 = **0.519347**; Ir' = **20.285 A**.

Course answer 137.82 V (S rounded to 0.139) agrees within 0.1 %.

## RC-M02-04 — basics and rotor resistance

- 4 poles, 50 Hz: Ns = **1500 rpm**; at 1440 rpm S = **0.04**, fr = **2 Hz**. At 30 Hz Ns = **900 rpm**.
- Rotor resistance: torque depends on Rr'/S only (for fixed Vs, f). Motor of RC-M02-01 at
  118.588 N·m and S = 0.0277778; adding Rx' = 0.23 Ω (total 0.46 Ω) gives S = **0.0555556**,
  N = **1700 rpm** for the same torque.

## RC-M02-05 — frequency control above base, constant voltage (course example, corrected)

Motor of RC-M02-02 (Rs = 0), 265.581 V per phase, base 60 Hz, required breakdown torque 35 N·m.

- Breakdown torque at base: Tmb = 3Vs²/[2ωb(Xs + Xr')] = 3 × 265.581²/(2 × 188.496 × 2.85)
  = **196.943 N·m** (ωb is the **mechanical** synchronous speed).
- β = √(Tmb/35) = **2.37212**; f = 60β = **142.327 Hz**; Ns = **4269.81 rpm**.
- Smax = Rr'/[β(Xs + Xr')] = **0.0562086**; speed at breakdown = **4029.81 rpm**.

The course slide gives 158.5 Hz and 4275 rpm because it uses rated torque as breakdown torque and
treats 377 rad/s (electrical) as mechanical (course-alignment §7, L-4). VADL uses the values above.

## Tolerances

Relative 1e−5 for algebraic values (literals to 6 significant figures). Dynamic settling to the
operating point: relative 1e−4.
