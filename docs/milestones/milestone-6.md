# Milestone 6 — Stepper motor and servo motor laboratories

Branch `milestone-6` (from `milestone-5`). Started 15 November 2026 after the owner approved
Milestone 5. Scope follows `docs/course-alignment.md` §5.4 and §5.5, which override
`docs/project-plan.md` §5 where they differ.

## Objectives

1. **M04 Stepper Motors.**
   - Course step-angle formula Sa = (Ns − Nr)/(Ns·Nr) × 360° for variable-reluctance motors, with
     the validation the course needs (Ns ≠ Nr, Sa > 0, integer PPR); phases m = Ns/(Ns − Nr).
   - Default motor: the course's 3-phase 6/4 VR motor (30° full step, 15° half step). Permanent
     magnet (7.5°) and hybrid (1.8°) two-phase motors from their steps per revolution (the
     course gives no formula for these; L-15).
   - Drive modes as taught: wave and normal (full step), half step; unipolar and bipolar coil
     waveforms; clockwise and anticlockwise. Microstepping as an extension for two-phase motors.
   - Outputs: Sa, PPR, pulse rate, time per step, speed N = Sa·PR/6, pulse count, commanded and
     rotor position; the lab's phase-sequence tables built from the model.
   - Rotor: ideal by default (no missed steps, as the plan states); an optional rotor-dynamics
     mode (extension) shows step oscillation, load angle and lost steps at high pulse rates.
2. **M05 Servo Motors.**
   - Course content: servo amplifier, motor and sensor; drive signal Vcs − Vfc; DC servo
     (armature controlled); AC two-phase servo and servo vs stepper (theory); quadrature encoder
     (×4 counts, index Z, direction from A/B) and resolver (sine/cosine, quadrant).
   - Model: DC servo plant (La, Ra, kφ, J, B, TL) with position or speed feedback, amplifier gain
     and ±Va limit. Integral and derivative action with anti-windup and the response metrics
     (rise time, overshoot, settling time, steady-state error) are an advanced extension (L-16).
   - Reference input: step, ramp or sine; reference and actual position, speed and error shown.
3. **Assessment:** a phase-sequence table question type (course-alignment §5.11: examined every
   year), marked exactly, with angles to ±0.5°.
4. Each laboratory gets content, an original question bank, a report definition and activities,
   registered in `src/modules/labs.ts`.

## Stated limits

- Stepper: ideal rotor by default; the dynamic option uses a sinusoidal torque–angle law with
  typical (assumed) values, ideal current drive (no winding inductance, so torque does not fall
  with pulse rate as on a real motor), and a constant load torque.
- Servo: ideal sensors (unless the encoder's quantisation is selected); no backlash or Coulomb
  friction; continuous-time controller; typical (assumed) motor values.

## Gate

Both laboratories run end to end and match the hand-worked reference cases
(`docs/reference-cases/stepper-motor.md`, `servo-motor.md`); all checks pass.
