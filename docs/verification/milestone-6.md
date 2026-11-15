# Verification report — Milestone 6

Stepper motor (M04) and servo motor (M05) laboratories, with a phase-sequence table question
type. Branch `milestone-6` (from `milestone-5`), run on 15 November 2026, Windows 11, Node
v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-6.md`. Models:
`docs/simulation-models/m04-stepper-motor.md`, `docs/simulation-models/m05-servo-motor.md`.

## 1. Gate

The plan's gate: both laboratories run end to end and match the hand-worked reference cases; all
checks pass.

| Item                                 | Evidence                                                                                                                                   | Result |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Stepper equations match hand values  | RC-M04-01 to -05: 19 reference tests (step angles, course rejections, speeds, pulses, lab sequence tables, rotor dynamics, microstepping)  | Pass   |
| Servo equations and model match      | RC-M05-01 to -05: 11 reference tests (encoder 2¾ lines → 11 counts, resolver, 0.2 rad load error, Mp 15.526 % / tp 0.073 s, 90.7441 rad/s) | Pass   |
| Stepper laboratory in a real browser | Chromium, laptop and tablet: 6 wave pulses of the 6/4 VR motor → 180°; anticlockwise half step → −90°; timing diagram with three phases    | Pass   |
| Servo laboratory in a real browser   | Position step settles at 90° with drive signal 0; overshoot measured; speed servo reaches 866.5 rpm (RC-M05-04)                            | Pass   |
| Sequence-table questions             | 200 seeds per question mark the model's own table correct and a changed row wrong; card UI and e2e feedback                                | Pass   |
| Earlier laboratories unchanged       | All Milestone 1–5 tests pass                                                                                                               | Pass   |
| All checks                           | Section 4                                                                                                                                  | Pass   |

## 2. What was built

| Area               | Files                                  | Notes                                                                                                                                                                                 |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stepper equations  | `src/sim-core/equations/stepper.ts`    | Course Sa = (Ns − Nr)/(Ns·Nr) × 360° with validation; phases, PPR, speed, pulse rate, pulses for an angle; phase sequences (wave, normal, half, micro); sinusoidal torque–angle law   |
| Stepper model      | `src/sim-core/models/stepperMotor.ts`  | Pulses as discrete events in `project`; ideal rotor by default, rotor dynamics (load angle, lost steps) as an extension; four presets (VR 6/4, VR 12/8, PM 7.5°, hybrid 1.8°)         |
| Servo equations    | `src/sim-core/equations/servo.ts`      | Quadrature encoder (count, channels A/B/Z), resolver (outputs, atan2, quadrant), second-order formulas, load error, speed steady state, `responseMetrics`                             |
| Servo model        | `src/sim-core/models/servoMotor.ts`    | DC servo plant, Ve = Vcs − Vfc, amplifier limit, PI/PD extension with anti-windup, encoder feedback option; step, ramp and sine references; five presets                              |
| Residue display    | `cleanResidue` in `src/sim-core/units` | Integration residue below 1e−9 shown as 0 (a settled loop read 1.066e−14 V)                                                                                                           |
| Assessment         | `src/features/assessment/*`            | New `sequence` question kind: table of phase states and angles; cells exact, angles ±0.5° (course-alignment §5.11)                                                                    |
| Stepper laboratory | `src/modules/m04-stepper/*`            | Cross-section with energised poles and rotor at its angle, phase lights, sequence table with the current step, timing diagram, position trace, speed line, 6 activities, 10 questions |
| Servo laboratory   | `src/modules/m05-servo/*`              | Loop block diagram with live signals, shaft dial, encoder channels, readouts, response metrics, three charts, 6 activities, 10 questions                                              |
| Registration       | `src/modules/labs.ts`, `registry.ts`   | M04 and M05 `available`                                                                                                                                                               |

Questions are original to VADL; none is copied from course examinations. Keys come from the
sim-core functions verified in `tests/reference`. Course content for servos is qualitative, so
PID control, transfer-function results and response metrics are labelled as an extension (L-16).
Torque, inertia and motor values are typical (assumed) values (D4); the pages say so.

## 3. Tests

| File                                          | Tests          | Covers                                                                                                                                                      |
| --------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/reference/stepper-motor.test.ts`       | 19             | RC-M04-01 to -05                                                                                                                                            |
| `tests/reference/servo-motor.test.ts`         | 11             | RC-M05-01 to -05                                                                                                                                            |
| `tests/unit/sim-core/stepperMotor.test.ts`    | 13             | Validation; electrical cycles; every step of every mode is a stable detent; pulse timing and limit; direction change; step-size rule; lost steps            |
| `tests/unit/sim-core/servoMotor.test.ts`      | 13             | Validation; references; drive signal and saturation; derivative on measurement; encoder quantisation; anti-windup; ramp following error; metrics edge cases |
| `tests/unit/sim-core/units.test.ts`           | 20             | Added: `cleanResidue`                                                                                                                                       |
| `tests/unit/app/m04m05Labs.test.tsx`          | 12             | Seven regions; values at rest; course rejection message; half step and hybrid; recording; speed mode; question banks (200 seeds); sequence card             |
| `routes`, `dcLab`, `m02m03Labs`, `assessment` | updated        | Planned-module example now Milestone 7; reports list five links; narrowing for the new question kind                                                        |
| `tests/e2e/stepper-servo-labs.spec.ts`        | 3 × 2 projects | Stepper both directions and timing diagram; sequence question feedback; servo position and speed; no overflow, no console errors                            |
| `tests/e2e/home.spec.ts`                      | updated        | NFR-04 placeholder check now uses a planned module (Mechanical Transmission)                                                                                |

Total: 427 unit and reference tests; 39 Playwright runs passed, 1 skipped by design (tablet-menu
test at laptop width).

## 4. Command output (actual, abridged where marked)

```text
=================== npm ci
8 moderate severity vulnerabilities           (same lint-tool advisory as before)
[exit code: 0]
=================== npm run typecheck
[exit code: 0]
=================== npm run lint
[exit code: 0]
=================== npm run format:check
All matched files use Prettier code style!
[exit code: 0]
=================== npm run test:coverage
 Test Files  37 passed (37)
      Tests  427 passed (427)
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/models   |    99.4 |    94.71 |     100 |   99.57 |
Statements   : 94.09% ( 2469/2624 )
Branches     : 89.35% ( 1436/1607 )
Functions    : 85.95% ( 704/819 )
Lines        : 94.23% ( 2239/2376 )
[exit code: 0]
=================== npm run build
dist/assets/ServoLab-DICQw6W8.js            14.73 kB │ gzip:   4.71 kB
dist/assets/StepperLab-CmdU5X0z.js          15.46 kB │ gzip:   5.23 kB
dist/assets/index-CrSMmXip.js              143.95 kB │ gzip:  47.28 kB
dist/assets/graphs-BMvw2OAC.js             385.48 kB │ gzip: 110.34 kB   (charts; loaded only by pages that chart)
 (plus 24 smaller files)
✓ built in 1.80s
[exit code: 0]
=================== npm run test:e2e
  ok  [laptop] stepper: six wave steps of the 6/4 VR motor reach 180°, both directions (RC-M04-03)
  ok  [laptop] stepper: the sequence-table question marks a filled table
  ok  [laptop] servo: position step settles at 90°; speed servo reaches 866.5 rpm (RC-M05-04)
  ok  [tablet] (the same three tests)
  ok  (all Milestone 2–5 tests at both sizes; tablet-menu test skipped at laptop width)
  1 skipped
  39 passed (1.6m)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, equations 100 %, models 99.57 %,
units 100 %. The two new laboratory pages are at 67–77 % of lines in unit tests; their running
paths are exercised by the Playwright tests.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                                                                    | Resolution                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Physics in a test case:** a 0.1 N·m load applied suddenly to the lightly damped VR rotor pulled it over the torque hump (it ran away), so a planned case was ill-posed | A loaded rotor now starts at its load angle; the step case uses 0.05 N·m, with an energy check in RC-M04-04 showing it cannot slip a cycle |
| Anticlockwise sequence table showed −0° at step 0                                                                                                                        | Fixed in `stepperSequenceTable`                                                                                                            |
| Settled servo readings showed rounding residue (1.066e−14 V, cos 90° = 6e−17)                                                                                            | `cleanResidue` on servo outputs; unit test                                                                                                 |
| Timing diagram drawn as small line charts was hard to read                                                                                                               | Replaced by a stepped digital timing diagram (SVG), as in the course notes                                                                 |
| The 4/6 tooth case could not be entered one field at a time (every intermediate value is itself rejected)                                                                | Activity and test use Nr = 8 on the 6-pole motor (the same Ns < Nr case)                                                                   |
| Module files first created in a new folder instead of the registered `m04-stepper`                                                                                       | Moved; ids follow the registry                                                                                                             |
| Lazy laboratory chunks took over 5 s to load under the parallel test run                                                                                                 | `asyncUtilTimeout` raised to 15 s (inside the 30 s test timeout)                                                                           |
| First verification run: `npm ci` failed with EPERM because the dev server held the rolldown binary                                                                       | Dev server stopped; the full sequence was rerun from the start (section 4)                                                                 |

## 6. Open items for the owner's review

- **Course alignment:** L-15 (VR formula only; hybrid from datasheet) and L-16 (PID and response
  metrics are an extension) remain open; the pages label them accordingly.
- **Bench data (D4):** stepper torque/inertia and servo motor values are typical values.
- **Model limits shown to students:** ideal current drive for the stepper dynamics (no torque
  fall with pulse rate); ideal sensors and no backlash for the servo.
- **Projector check:** still to be done in a real classroom.
