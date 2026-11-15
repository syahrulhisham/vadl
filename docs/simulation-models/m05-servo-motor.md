# Simulation model: DC servo motor

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Model id         | `m05.dc-servo`                                                         |
| Module           | M05 – Servo Motors                                                     |
| Model class      | dynamic                                                                |
| Source files     | `src/sim-core/equations/servo.ts`, `src/sim-core/models/servoMotor.ts` |
| Reference cases  | `docs/reference-cases/servo-motor.md` (RC-M05-01 to -05)               |
| Status           | draft, Milestone 6                                                     |
| Course alignment | LN Ch2 Part II p9–26 (qualitative); formula sheet DC motor; L-16       |

## 1. Purpose

Show the closed loop the course describes (servo amplifier, motor, sensor; drive signal
Vcs − Vfc): how the motor is driven until the feedback matches the reference, why a
proportional servo holding a load keeps an error, and how the encoder and resolver report
position. Integral and derivative action and response metrics are an advanced extension.

## 2. Symbols and units

| Symbol     | Quantity                                 | SI unit               | Code name                           |
| ---------- | ---------------------------------------- | --------------------- | ----------------------------------- |
| Vcs, Vfc   | control (reference) and feedback signals | V                     | `vcs`, `vfc`                        |
| Ve         | drive signal Vcs − Vfc                   | V                     | `driveSignal`                       |
| Kp, Ki, Kd | amplifier gains                          | V/V, 1/s, s           | `kp`, `ki`, `kd`                    |
| Va, Vmax   | armature voltage, amplifier limit        | V                     | `armatureVoltage`, `vMax`           |
| Ra, La     | armature resistance, inductance          | Ω, H                  | `ra`, `la`                          |
| kφ         | motor constant                           | V·s/rad = N·m/A       | `kphi`                              |
| J, B, TL   | inertia, friction, load torque           | kg·m², N·m·s/rad, N·m | `inertia`, `friction`, `loadTorque` |
| Kfb, Kt    | position sensor, tachometer gains        | V/rad, V/(rad/s)      | `positionGain`, `tachGain`          |
| L          | encoder lines per revolution             | —                     | `encoderLines`                      |

## 3. Governing equations

```text
(1) Vcs = Kfb·θref, Vfc = Kfb·θ (position);  Vcs = Kt·ωref, Vfc = Kt·ω (speed)
(2) Ve = Vcs − Vfc                                  (course, LN Ch2 Part II p10)
(3) Va = clamp(Kp·Ve + Ki·∫Ve dt − Kd·Kfb·ω, ±Vmax)  (Kd position mode only)
(4) La·dIa/dt = Va − Ra·Ia − kφ·ω
(5) J·dω/dt = kφ·Ia − B·ω − TL                      (course formula sheet)
(6) dθ/dt = ω
(7) encoder count = ⌊4·L·θ/2π⌋;  resolver Vsin = sin θ, Vcos = cos θ; θ = atan2
```

State vector `[Ia, ω, θ, z]` with dz/dt = Ve while Ki > 0, held at zero rate while the amplifier
is saturated in the direction the error pushes (anti-windup by clamping).

## 4. Assumptions

As listed in `servoMotorModel.assumptions` (shown on screen and in the report).

## 5. Limitations

- Ideal potentiometer and tachometer; the encoder option quantises the angle only.
- No backlash, Coulomb friction or compliance; constant load torque.
- Continuous-time controller; amplifier without its own dynamics.
- Typical assumed motor values (D4). AC two-phase servos are described in the theory only.

## 6. Parameters and valid ranges

| Parameter | Default    | Min       | Max      | Message if violated                       |
| --------- | ---------- | --------- | -------- | ----------------------------------------- |
| Kp        | 5          | 0         | 200      | range; warning if Kp = Ki = 0 (open loop) |
| Ki        | 0          | 0         | 2000     | range                                     |
| Kd        | 0          | 0         | 1        | range                                     |
| Vmax      | 24 V       | 1         | 200      | range                                     |
| Ra, La    | 2 Ω, 2 mH  | 0.1, 1e−5 | 20, 0.1  | range                                     |
| kφ        | 0.1        | 0.01      | 2        | range                                     |
| J, B      | 1e−4, 1e−4 | 1e−6, 0   | 0.1, 0.1 | range                                     |
| TL        | 0          | 0         | 5        | warning above stall torque kφ·Vmax/Ra     |
| Kfb, Kt   | 1, 0.05    | 0.1, 0.01 | 10, 1    | range                                     |
| L         | 500        | 1         | 10000    | whole number                              |

## 7. Numerical method

RK4. Fastest time constant τ = 1/max(Ra/La, ωem, ωpos, ωi), with ωem from the
electromechanical loop √((Ra·B + kφ(kφ + loop gain))/(La·J)), ωpos = √(Kp·Kfb·kφ/(Ra·J)) and
ωi = ∛(Ki·K·kφ/(Ra·J)). Δt = τ/10 (0.1 ms for the defaults). Initial state at rest.

## 8. Outputs

Reference, position, speed and error (SI plus degrees or rpm), `vcs`, `vfc`, `driveSignal`,
`armatureVoltage`, `saturated`, `armatureCurrent`, `torque`, `encoderCount`, encoder channels
A, B, Z, resolver sine and cosine, angle and quadrant. Rise time, overshoot, settling time and
steady-state error are computed from the recorded trace by `responseMetrics`.

## 9. Verification

| Case      | Expected                                         | Tolerance    | Test file                             |
| --------- | ------------------------------------------------ | ------------ | ------------------------------------- |
| RC-M05-01 | 11 counts; 2000/500 counts; 0.18°; resolver 210° | exact / 1e−6 | `tests/reference/servo-motor.test.ts` |
| RC-M05-02 | 0.2 rad, 0.5 A, 1 V; PI → 0                      | 1e−4         | same                                  |
| RC-M05-03 | Mp 15.526 %, tp 0.073045 s                       | 0.5 %        | same                                  |
| RC-M05-04 | 90.7441 rad/s, 9.2559 V, saturation at start     | 1e−4         | same                                  |
| RC-M05-05 | rise 0.21972 s, settling 0.39120 s               | 1 ms         | same                                  |

Also checked (unit tests): ramp following error 0.0408 rad = ω·(B + kφ²/Ra)/K; anti-windup;
derivative on measurement.

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 6 |
