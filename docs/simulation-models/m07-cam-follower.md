# Simulation model: cam and follower

| Field            | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Model id         | `m07.cam-follower`                                                    |
| Module           | M07 – Cam and Follower                                                |
| Model class      | dynamic (kinematic: cam angle only)                                   |
| Source files     | `src/sim-core/equations/cam.ts`, `src/sim-core/models/camFollower.ts` |
| Reference cases  | `docs/reference-cases/cam-follower.md` (RC-M07-01 to -04)             |
| Status           | draft, Milestone 7                                                    |
| Course alignment | LN Ch3 Part I p20–35; course-alignment §5.7; L-19                     |

## 1. Purpose

Relate the cam shape to the follower motion: rise, dwell and return, the displacement diagram
the course constructs at 30° steps, and the three follower types.

## 2. Symbols and units

| Symbol     | Quantity                             | SI unit      | Code name                    |
| ---------- | ------------------------------------ | ------------ | ---------------------------- |
| θ, ω       | cam angle, speed                     | rad, rad/s   | state, `camSpeed`            |
| h          | lift                                 | m            | `lift`                       |
| β1, βd, β2 | rise, upper dwell, return angles     | rad          | `riseAngle` …                |
| s, v, a    | displacement, velocity, acceleration | m, m/s, m/s² | `displacement` …             |
| Rb, Rr     | base-circle and roller radii         | m            | `baseRadius`, `rollerRadius` |
| φ          | pressure angle (extension)           | rad          | `pressureAngleDeg`           |

## 3. Governing equations

Motion laws as tabulated in the reference case document (uniform velocity, SHM, uniform
acceleration, cycloidal). v = (ds/dθ)·ω, a = (d²s/dθ²)·ω². Pressure angle
tan φ = (ds/dθ)/(Rp + s), Rp = Rb (knife) or Rb + Rr (roller). Profile (cam frame, clockwise
rotation): knife radius Rb + s at angle −θ; roller pitch curve offset by Rr along the contact
normal; flat face contact at x = −ds/dθ, height Rb + s, rotated into the cam frame.

State `[θ]`, dθ/dt = ω, wrapped to one turn by `project`.

## 4. Assumptions

As listed in `camFollowerModel.assumptions`.

## 5. Limitations

Radial followers only; no follower jump, spring or friction; uniform velocity has
theoretically infinite acceleration at segment ends (shown as zero inside segments).

## 6. Parameters and valid ranges

Lift 1–100 mm; rise and return 10°–350°; dwell 0°–340°; sum ≤ 360°; base radius 10–200 mm;
roller 2–50 mm; cam speed 0–100 rad/s. Warnings: pressure angle above 30° (knife, roller);
flat-face profile not convex (Rb + s + d²s/dθ² < 0).

## 7. Numerical method

Exact integration of constant ω; fastest time constant 0.1/ω, so a step is about 0.6° of cam
rotation.

## 8. Outputs

`camAngleDeg`, `displacement`, `displacementMm`, `velocity`, `acceleration`, `segment`,
`pressureAngleDeg`, `followerHeight`, `camSpeedRpm`; `camDisplacementTable`, `camProfileOf`.

## 9. Verification

| Case      | Expected                                        | Test file                              |
| --------- | ----------------------------------------------- | -------------------------------------- |
| RC-M07-01 | 0.166667 mm/°; 0, 5, … 30, … 0 mm; 0.06 m/s     | `tests/reference/cam-follower.test.ts` |
| RC-M07-02 | 7.5, 3.75, 26.25, 2.72535 mm; peak v and a      | same                                   |
| RC-M07-03 | 10, 20, 13.3333, 0 mm                           | same                                   |
| RC-M07-04 | 8.35767°; knife, roller and flat profile checks | same                                   |

## 10. Change log

| Date        | Change        | By          |
| ----------- | ------------- | ----------- |
| 15 Nov 2026 | First version | Milestone 7 |
