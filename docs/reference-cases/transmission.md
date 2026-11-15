# Reference cases RC-M06-01 to RC-M06-06: mechanical transmission

| Field            | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Module           | M06 – Mechanical Transmission                                                           |
| Source of case   | LN Ch3 Part I (belts) and Part II (gears, pulleys), Tutorial 4; RC-M06-05 is VADL's own |
| Course alignment | G = T_driven/T_driver (> 1 is a reduction), stated once and used throughout (L-9)       |
| Worked by        | Hand calculation, 15 November 2026                                                      |
| Status           | Tests: `tests/reference/transmission.test.ts`                                           |

## Conventions

- Gear ratio **G = T_driven/T_driver** (teeth), belt and chain ratio **G = D_driven/D_driver**
  (diameters or sprocket teeth). N_out = N_in/G. G > 1 is a speed reduction.
- A compound train multiplies the stage ratios; wheels on one shaft share its speed.
- Direction: each external gear mesh reverses; an idler gear reverses twice (no change) and
  does not alter the ratio; an open belt and a chain keep the direction; a crossed belt reverses.
- Torque (extension, beyond the course): T_out = η·G·T_in; ideal η = 1.

## RC-M06-01 — simple gear pairs (LN Ch3 Part II examples 1–3, Tutorial 4 Q1–Q3)

| Case            | Working         | Result                    |
| --------------- | --------------- | ------------------------- |
| 60T @ 120 → 30T | G = 30/60 = 0.5 | N = **240 rpm**, reversed |
| 25T @ 60 → 75T  | G = 3           | N = **20 rpm**            |
| 20T @ 100 → 80T | G = 4           | N = **25 rpm**            |
| 20T → 40T       | G = 40/20       | **2** (2:1)               |
| 15T @ 400 → 60T | G = 4           | **100 rpm**               |
| 20T @ 60 → 30T  | G = 1.5         | **40 rpm**                |

## RC-M06-02 — idler and compound trains

- Tutorial 4 Q4: A 16T at 600 rpm CW, idler B 28T, C 84T. G = 84/16 = **5.25**;
  N_B = 600 × 16/28 = **342.857 rpm** (anticlockwise); N_C = 600/5.25 = **114.286 rpm**,
  **clockwise** (the idler restores A's direction).
- LN Ch3 Part II example 4: A 120T at 30 rpm CW drives B 40T; C 80T on B's shaft drives D 20T.
  N_B = N_C = 30 × 120/40 = **90 rpm** (anticlockwise); N_D = 90 × 80/20 = **360 rpm**,
  **clockwise**. Overall G = (40/120)(20/80) = **1/12 = 0.083333**.
- Tutorial 4 Q5: A 60T → B 15T; C 40T (on B) → D 14T. Train speed-up (60/15)(40/14) =
  **11.4286** (the answer scheme's 11.42 is truncated); G = **0.0875**.

## RC-M06-03 — chain and belt drives

- Tutorial 4 Q6: pedal sprocket 60T at 150 rpm CW, chain to 30T: **2** turns per pedal turn,
  **300 rpm, clockwise** (a chain keeps the direction).
- LN Ch3 Part II p38–41: driver 200 mm at 20 rpm, driven 400 mm: G = **2**, N = **10 rpm**;
  driven 600 mm: G = **3**.
- LN Ch3 Part II p42–43: A 100 mm at 60 rpm anticlockwise, **crossed** belt to B 200 mm;
  C 100 mm (on B) open belt to D 120 mm; E 40 mm (on D) open belt to F 30 mm.
  N_B = **30 rpm** clockwise; N_D = 30 × 100/120 = **25 rpm**; N_F = 25 × 40/30 =
  **33.3333 rpm**, **clockwise**.

## RC-M06-04 — lifting pulleys (LN Ch3 Part II p46–56)

MA = load/effort; VR = effort distance/load distance; η = MA/VR. Ideal MA = VR = number of
supporting rope segments n.

- Effort 40 N, load 80 N, effort moves 2 m, load 1 m: MA = **2**, VR = **2**, η = **100 %**.
- n = 4, load 100 N, effort moves 4 m: MA = VR = **4**, effort **25 N**, load moves **1 m**.
- 25 N effort for a 150 N load: MA = **6**, VR = 6, η = 100 %.
- Extension (L-20): n = 4, η = 80 %, load 100 N → effort = 100/(4 × 0.8) = **31.25 N**.

## RC-M06-05 — belt tensions (LN Ch3 Part I p8–9; numbers VADL's own)

T1 = 500 N, T2 = 200 N, driver radius 0.1 m at 600 rpm (ω = 62.8319 rad/s), driven radius 0.25 m:

- Torque on the driver (T1 − T2)·r = 300 × 0.1 = **30 N·m**; on the driven pulley
  300 × 0.25 = **75 N·m**.
- Belt speed v = ω·r = **6.28319 m/s**; power P = (T1 − T2)·v = **1884.96 W**.

## RC-M06-06 — torque through a train (extension)

T_in = 10 N·m through G = 5.25 with η = 0.95: T_out = **49.875 N·m**; ideal (η = 1) **52.5 N·m**.
Power is conserved when ideal: 10 N·m × 600 rpm = 52.5 N·m × 114.286 rpm = **628.319 W**.

## Tolerances

Relative 1e−9 (exact arithmetic); directions exact.
