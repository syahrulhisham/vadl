# Reference case RC-M01-01: separately excited DC motor, steady state

| Field            | Value                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module           | M01 – DC Motor Drives                                                                                                                                          |
| Model            | `dc-motor.separately-excited` (Milestone 4)                                                                                                                    |
| Source of case   | Project plan, section 7, "Reference cases" (first row)                                                                                                         |
| Course alignment | Checked against LN Ch1 Part II p15 (D2): course writes Eg = Va − Ia·Ra, Eg = Kv·ω·If, Td = Kv·If·Ia; Kφ here = Kv·If. Course analysis is steady state, as here |
| Worked by        | Hand calculation, 14 November 2026                                                                                                                             |
| Status           | Calculated; automated test to be written with the equation functions in Milestone 4                                                                            |

## 1. Given

| Symbol | Quantity                             | Value                                         | Unit              |
| ------ | ------------------------------------ | --------------------------------------------- | ----------------- |
| V_a    | Armature terminal voltage            | 220                                           | V                 |
| R_a    | Armature resistance                  | 0.5                                           | Ω                 |
| Kφ     | Machine constant (= K_e = K_t in SI) | 1.2                                           | V·s/rad (= N·m/A) |
| T_L    | Load torque                          | 24                                            | N·m               |
| B      | Viscous friction coefficient         | 0                                             | N·m·s/rad         |
| I_f    | Field current                        | constant (separately excited, so Kφ constant) | A                 |

## 2. Model equations

```latex
(1)\; V_a = E_b + I_a R_a + L_a \frac{dI_a}{dt}
(2)\; E_b = K\phi\,\omega
(3)\; T_e = K\phi\,I_a
(4)\; J \frac{d\omega}{dt} = T_e - T_L - B\,\omega
```

At steady state dI_a/dt = 0 and dω/dt = 0, so L_a and J do not affect the result.

## 3. Assumptions

1. Steady state (all derivatives zero).
2. Linear magnetic circuit: Kφ constant for the constant field current.
3. No armature reaction, no brush drop, ideal DC supply.
4. B = 0, so shaft torque equals electromagnetic torque.
5. Efficiency is for the armature circuit only; field-circuit loss is excluded because the field
   is separately supplied and its resistance is not given.

## 4. Working

**Step 1 — armature current.** From (4) with dω/dt = 0 and B = 0: T_e = T_L. From (3):

I_a = T_L / Kφ = 24 / 1.2 = **20 A** (exact)

**Step 2 — back EMF.** From (1) with dI_a/dt = 0:

E_b = V_a − I_a R_a = 220 − 20 × 0.5 = 220 − 10 = **210 V** (exact)

**Step 3 — angular velocity.** From (2):

ω = E_b / Kφ = 210 / 1.2 = **175 rad/s** (exact)

**Step 4 — speed in rpm.** n = 60 ω / (2π):

n = 60 × 175 / (2π) = 10 500 / 6.283 185 3 = **1671.127 rpm** (1671.1 rpm to 5 s.f.)

**Step 5 — power balance.**

- Armature input power P_in = V_a I_a = 220 × 20 = **4400 W**
- Copper loss P_cu = I_a² R_a = 20² × 0.5 = **200 W**
- Developed power P_dev = E_b I_a = 210 × 20 = **4200 W**
- Check: P_dev = T_e ω = 24 × 175 = 4200 W ✔ and P_in = P_dev + P_cu = 4200 + 200 = 4400 W ✔
- Shaft output P_out = P_dev − Bω² = 4200 − 0 = **4200 W**

**Step 6 — armature-circuit efficiency.**

η = P_out / P_in = 4200 / 4400 = 0.954 545… = **95.45 %**

**Step 7 — overall efficiency including the field (added 15 Nov 2026 for the laboratory model).**
The VADL laboratory supplies the field at Vf = 220 V through Rf = 220 Ω, so If = 1 A and
Kv = 1.2 V/(A·rad/s) gives Kv·If = 1.2 as above. Field power Vf·If = **220 W**.
Total input 4400 + 220 = **4620 W**; overall η = 4200 / 4620 = 0.909 091 = **90.91 %**.

**Supplementary check — starting current** (ω = 0 at standstill, so E_b = 0):

I_a,start = V_a / R_a = 220 / 0.5 = **440 A**, i.e. 22 times the loaded current. This is the
reason for starting resistance or reduced-voltage starting, and will be a Milestone 4 activity.

## 5. Expected results and test tolerances

| Quantity             | Expected                  | Tolerance in test                                    | Reason                                                   |
| -------------------- | ------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| I_a                  | 20 A                      | absolute 1 × 10⁻⁹ A                                  | Exact algebraic result                                   |
| E_b                  | 210 V                     | absolute 1 × 10⁻⁹ V                                  | Exact                                                    |
| ω                    | 175 rad/s                 | absolute 1 × 10⁻⁹ rad/s                              | Exact                                                    |
| n                    | 1671.127 rpm              | absolute 5 × 10⁻⁴ rpm                                | Rounded to 3 decimal places                              |
| P_in, P_cu, P_dev    | 4400 W, 200 W, 4200 W     | absolute 1 × 10⁻⁶ W                                  | Exact                                                    |
| η                    | 0.954 545                 | absolute 5 × 10⁻⁷                                    | Rounded to 6 decimal places                              |
| I_a,start            | 440 A                     | absolute 1 × 10⁻⁹ A                                  | Exact                                                    |
| Dynamic model, t → ∞ | ω → 175 rad/s, I_a → 20 A | relative 1 × 10⁻⁴ after 10 mechanical time constants | Checks RK4 model converges to the algebraic steady state |

## 6. Independent check

Values agree with the plan's reference table (I_a = 20 A; E_b = 210 V; ω = 175 rad/s =
1671.1 rpm; armature efficiency 95.45 %). A course-sourced companion case, RC-M01-02 (Tutorial 2 Q2,
converter-fed drive), is listed in `docs/course-alignment.md` §6.
