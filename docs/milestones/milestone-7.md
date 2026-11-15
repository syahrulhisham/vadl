# Milestone 7 — Mechanical transmission and cam and follower laboratories

Branch `milestone-7` (from `milestone-6`). Started 15 November 2026 after the owner approved
Milestone 6. Scope follows `docs/course-alignment.md` §5.6 and §5.7, which override
`docs/project-plan.md` §5 where they differ.

## Objectives

1. **M06 Mechanical Transmission.**
   - Drive trains of one to three compound stages: gear pair (optional idler), open belt,
     crossed belt, chain. Speed and direction of every shaft, overall ratio, and an animation
     driven by the model's shaft angles.
   - One stated convention: G = T_driven/T_driver (belts D_driven/D_driver), N_out = N_in/G (L-9).
   - Belt tensions: torque (T1 − T2)·r, belt speed v = ω·r, power (T1 − T2)·v.
   - Lifting pulleys (examined every year): MA, VR, efficiency, effort and distances.
   - Torque through the train T_out = η·G·T_in and stage efficiency as an extension (the master
     instruction asks for output torque; the course gives only the qualitative statement).
2. **M07 Cam and Follower.**
   - Plate cam with rise, upper dwell, return and lower dwell; uniform velocity as taught;
     simple harmonic, uniform acceleration and cycloidal motion as extensions.
   - Knife-edge (added, the course's first type), roller and flat-faced followers; cam profile
     drawn from the motion; follower displacement, velocity and acceleration; pressure angle
     (extension).
   - Displacement diagram and the course's tabulation at 30°, 45° or 22.5° steps.
3. **Assessment:** a numeric-table question type (course-alignment §5.11: cam displacement
   diagrams), each value marked to a tolerance; gear-train speed with direction as a signed
   answer.
4. Content, original question banks, report definitions and activities for both laboratories.

## Stated limits

- Transmission: rigid parts, no slip, backlash or belt stretch; belt length, slip and
  e^(μθ) are beyond the syllabus and not modelled.
- Cam: radial followers only (offset is an extension not built); no follower jump or spring
  dynamics; profile construction on a polar grid is shown but not assessed automatically.

## Gate

Both laboratories run end to end and match the hand-worked reference cases
(`docs/reference-cases/transmission.md`, `cam-follower.md`); all checks pass.
