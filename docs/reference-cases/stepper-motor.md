# Reference cases RC-M04-01 to RC-M04-05: stepper motors

| Field            | Value                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Module           | M04 – Stepper Motors                                                                               |
| Source of case   | LN Ch2 Part I (step angle, speed, 6/4 VR lab tables), Tutorial 3, course MCQ stepper set; dynamics |
| Course alignment | Sa = (Ns − Nr)/(Ns·Nr) × 360°; N = Sa·PR/6; PPR = 360/Sa (course-alignment §4, §5.4)               |
| Worked by        | Hand calculation, 15 November 2026                                                                 |
| Status           | Tests: `tests/reference/stepper-motor.test.ts`                                                     |

## Equations (course notation)

- Step angle (variable reluctance): **Sa = (Ns − Nr)/(Ns·Nr) × 360°**, Ns stator poles, Nr rotor
  teeth. Number of phases m = Ns/(Ns − Nr). Pulses per revolution **PPR = 360°/Sa**.
- Speed: **N = Sa·PR·60/360 = Sa·PR/6 = PR·60/PPR** (rpm, PR in pulses/s).
- Time per step = 1/PR. Pulses for an angle = angle/Sa. Half step: Sa/2, PPR doubles.

Validation the course requires (§5.4): Ns ≠ Nr, Sa > 0, and PPR an integer.

## RC-M04-01 — step angle and speed (LN Ch2 Part I, Tutorial 3)

| Case                    | Working                           | Result                                  |
| ----------------------- | --------------------------------- | --------------------------------------- |
| VR 6/4                  | (6 − 4)/(6·4) × 360 = 2/24 × 360  | Sa **30°**, m **3**, PPR **12**         |
| VR 12/8                 | 4/96 × 360                        | Sa **15°**, m **3**, PPR **24**         |
| VR 8/6                  | 2/48 × 360                        | Sa **15°**, m **4**, PPR **24**         |
| Sa 15°, PR 300 pulses/s | 15·300/6                          | N **750 rpm**                           |
| Sa 10°, N 200 rpm       | PR = 6N/Sa = 1200/10              | PR **120 pulses/s**                     |
| VR 6/4 at 100 rpm       | PR = 6·100/30; time per step 1/20 | PR **20 pulses/s**, **0.05 s** per step |
| VR 4/6 (Ns < Nr)        | (4 − 6)/24 × 360 = −30°           | **rejected**: negative step angle       |
| VR 7/4                  | 3/28 × 360 = 38.571°; PPR = 9.333 | **rejected**: PPR is not an integer     |

## RC-M04-02 — pulses, speed and half step (course MCQ stepper set)

- 1.8° (200 PPR) at 500 pulses/s: N = 1.8·500/6 = **150 rpm**; half step 0.9°: **75 rpm**.
- 90° with 200 PPR: 90/1.8 = **50 pulses**; with 400 PPR (half step): **100 pulses**.
- 1000 pulses at 1.8°: **1800°** (5 revolutions); at 0.9°: **900°**.
- 7.5° (48 PPR) at 1000 pulses/s: 1000·60/48 = **1250 rpm**.

## RC-M04-03 — phase sequence tables, 3-phase 6/4 VR motor (LN Ch2 Part I lab tables)

Clockwise taken as the positive direction; the sequence A → B → C turns the rotor clockwise.

| Step | Wave (one phase on) | Angle | Normal (two phases on) | Angle | Half step | Angle |
| ---- | ------------------- | ----- | ---------------------- | ----- | --------- | ----- |
| 0    | A                   | 0°    | AB                     | 15°   | A         | 0°    |
| 1    | B                   | 30°   | BC                     | 45°   | AB        | 15°   |
| 2    | C                   | 60°   | CA                     | 75°   | B         | 30°   |
| 3    | A                   | 90°   | AB                     | 105°  | BC        | 45°   |
| 4    | B                   | 120°  | BC                     | 135°  | C         | 60°   |
| 5    | C                   | 150°  | CA                     | 165°  | CA        | 75°   |
| 6    | A                   | 180°  | AB                     | 195°  | A         | 90°   |

Anticlockwise (wave): A, C, B, A at 0°, −30°, −60°, −90°.

Two-phase bipolar motor (PM or hybrid), full step, signs give the current direction:
wave A+, B+, A−, B−; normal A+B+, A−B+, A−B−, A+B−; half step A+, A+B+, B+, A−B+, A−, A−B−,
B−, A+B−.

## RC-M04-04 — rotor dynamics (VADL model; not a course example)

Torque of each phase with current i: T = −Tpk·i·sin(Ne(θ − θk)), with Ne = Nr electrical cycles
per revolution for a VR motor. Rotor: J·dω/dt = T − B·ω − TL.

Default VR 6/4 motor (typical values, assumed): Tpk 0.2 N·m, J 2×10⁻⁵ kg·m², B 8×10⁻⁴ N·m·s/rad.

- Stiffness at equilibrium: dT/dθ = −Ne·Tpk = −4 × 0.2 = **−0.8 N·m/rad**.
- Small-signal natural frequency ωn = √(Ne·Tpk/J) = √(0.8/2×10⁻⁵) = **200 rad/s** (31.83 Hz);
  ζ = B/(2√(J·Ne·Tpk)) = 8×10⁻⁴/(2 × 0.004) = **0.1**.
- Load angle with TL = 0.1 N·m against clockwise motion: sin(Ne·Δθ) = TL/Tpk = 0.5, so
  Ne·Δθ = 30° electrical and **Δθ = 7.5°** mechanical: a loaded rotor at rest sits at **−7.5°**.
- One wave step (no load) settles at **30°**.
- One wave step with TL = 0.05 N·m: load angle asin(0.25)/4 = 14.4775°/4 = **3.61938°**; the
  rotor moves from −3.61938° and settles at 30° − 3.61938° = **26.3806°**.
  Energy check (per unit Ne, V(x) = −Tpk·cos x + TL·x, x electrical, relative to the new
  detent): start V(−134.48°) = 0.02277; the barrier behind, V(−194.48°) = 0.02394, is higher,
  so the damped rotor cannot slip back a cycle. (A sudden 0.1 N·m step load would not satisfy
  this: a wave step of a 3-phase VR motor is 120° electrical, a large jump.)
- With TL = 0.25 N·m > Tpk the motor cannot hold the load at all (validation warning).

## RC-M04-05 — microstepping (extension, two-phase bipolar)

1.8° motor with 1/16 microstepping: angle per pulse 1.8/16 = **0.1125°**, **3200** pulses per
revolution; at 3200 pulses/s the speed is 0.1125·3200/6 = **60 rpm**. Coil currents at microstep
k: iA = cos(k·90°/16), iB = sin(k·90°/16); at k = 4: iA = **0.92388**, iB = **0.38268**.

## Tolerances

Formula cases: relative 1e−9 (exact arithmetic). Sequence tables: exact. Dynamics: settled angle
within 0.05°.
