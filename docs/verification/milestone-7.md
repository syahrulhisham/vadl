# Verification report — Milestone 7

Mechanical transmission (M06) and cam and follower (M07) laboratories, with a numeric-table
question type. Branch `milestone-7` (from `milestone-6`), run on 15 November 2026, Windows 11,
Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-7.md`. Models:
`docs/simulation-models/m06-transmission.md`, `docs/simulation-models/m07-cam-follower.md`.

## 1. Gate

The plan's gate: both laboratories run end to end and match the hand-worked reference cases; all
checks pass.

| Item                                 | Evidence                                                                                                                                            | Result |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Transmission equations and model     | RC-M06-01 to -06: 18 reference tests (gear pairs, idler, compound trains, chain, belt train A–F, lifting pulleys, belt tensions, torque, power)     | Pass   |
| Cam equations and model              | RC-M07-01 to -04: 10 reference tests (course 30 mm/180° table, four motion laws, rise–dwell–return, pressure angle, knife/roller/flat profiles)     | Pass   |
| Transmission laboratory in a browser | Chromium, laptop and tablet: compound train turns (wheel D's drawn angle changes), belt train F 33.33 rpm clockwise, lifting pulley n = 6 → 16.67 N | Pass   |
| Cam laboratory in a browser          | Displacement and velocity follow the uniform-velocity law at the angle where the cam is paused; 60 mm/s at 60 rpm; displacement diagram drawn       | Pass   |
| Table and signed-answer questions    | 200 seeds per question mark the model's own answers correct; wrong rows named; sign hint on the compound-train answer                               | Pass   |
| Earlier laboratories unchanged       | All Milestone 1–6 tests pass                                                                                                                        | Pass   |
| All checks                           | Section 4                                                                                                                                           | Pass   |

## 2. What was built

| Area                   | Files                                    | Notes                                                                                                                                                                |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transmission equations | `src/sim-core/equations/transmission.ts` | G = T_driven/T_driver (belts D_driven/D_driver), stated once (L-9); direction rules; torque (extension); belt torque, speed, power; MA, VR, η; lifting pulley        |
| Transmission model     | `src/sim-core/models/transmission.ts`    | One to three compound stages (gear with idler, open/crossed belt, chain); every shaft angle from the input angle; five presets from the lecture notes and Tutorial 4 |
| Cam equations          | `src/sim-core/equations/cam.ts`          | Uniform velocity (course); SHM, uniform acceleration, cycloidal (extensions); rise–dwell–return–dwell; pressure angle; knife-edge, roller and flat-faced profiles    |
| Cam model              | `src/sim-core/models/camFollower.ts`     | Cam angle state; displacement, velocity, acceleration; displacement table at 30°, 45°, 22.5°; pressure-angle and flat-face cusp warnings; three presets              |
| Assessment             | `src/features/assessment/*`              | New `table` question kind (numeric rows, each within max(absolute, relative) tolerance)                                                                              |
| Transmission lab       | `src/modules/m06-transmission/*`         | Drive-train drawing turning at the computed speeds, wheel table (speed, direction, torque), belt-tension and lifting-pulley views, 6 activities, 10 questions        |
| Cam lab                | `src/modules/m07-cam-follower/*`         | Cam and follower drawing from the computed profile, displacement table, displacement/velocity/acceleration diagrams, 5 activities, 9 questions                       |
| Registration           | `src/modules/labs.ts`, `registry.ts`     | M06 and M07 `available`                                                                                                                                              |

Questions are original to VADL; none is copied from course examinations. Examination-derived
cases noted in the private analysis (gear train Q4(a), pulley Q5(b), cam Q1(e)) are not used.

## 3. Tests

| File                                                                     | Tests          | Covers                                                                                                                                          |
| ------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/reference/transmission.test.ts`                                   | 18             | RC-M06-01 to -06                                                                                                                                |
| `tests/reference/cam-follower.test.ts`                                   | 10             | RC-M07-01 to -04, including profile invariants for all three followers                                                                          |
| `tests/unit/sim-core/transmissionCam.test.ts`                            | 12             | Validation and warnings, direction rules, shaft angles, idler outputs, step rule; motion-law continuity; cam validation, warnings, wrap, tables |
| `tests/unit/app/m06m07Labs.test.tsx`                                     | 13             | Seven regions; course examples on screen; views; stage type change; recording; wheel lettering; cam table; question banks; table card           |
| `routes`, `dcLab`, `m02m03Labs`, `m04m05Labs`, `assessment`, `home.spec` | updated        | Planned-module example now Pneumatics (Milestone 8); seven report links; narrowing for the new kind                                             |
| `tests/e2e/transmission-cam-labs.spec.ts`                                | 2 × 2 projects | Transmission and cam laboratories end to end; no overflow, no console errors                                                                    |

Total: 480 unit and reference tests; 43 Playwright runs passed, 1 skipped by design.

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
=================== npm run build
dist/assets/CamLab-24ij3P4U.js               9.61 kB │ gzip:   3.41 kB
dist/assets/TransmissionLab-CByCZa0X.js     18.47 kB │ gzip:   5.70 kB
dist/assets/index-By_sW6tF.js              143.95 kB │ gzip:  47.29 kB
dist/assets/graphs-Blhh-ZKU.js             385.48 kB │ gzip: 110.35 kB   (charts; loaded only by pages that chart)
✓ built in 3.94s
[exit code: 0]

--- first run of the last two steps (machine under load) ---
=================== npm run test:coverage
 Test Files  5 failed | 36 passed (41)
      Tests  5 failed | 475 passed (480)
 (all five: "Unable to find an element by [data-testid=lab-shell]" or a page heading
  within the 15 s wait — lazy page loads, no assertion on a value failed)
=================== npm run test:e2e
  3 failed  (30 s test timeouts in home and dc-lab specs; 2.1 min in total)
  1 skipped
  40 passed

--- rerun, unchanged code ---
=================== npm run test:coverage
 Test Files  41 passed (41)
      Tests  480 passed (480)
   Duration  26.76s
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/models   |   99.53 |       95 |     100 |   99.66 |
Statements   : 93.88% ( 3053/3252 )
Branches     : 88.5% ( 1732/1957 )
Functions    : 85.44% ( 875/1024 )
Lines        : 94.07% ( 2777/2952 )
[exit code: 0]
=================== npm run test:e2e
  ok  [laptop] transmission: compound train turns, belt train direction, lifting pulley (RC-M06-02 to -04)
  ok  [laptop] cam: displacement and velocity follow the uniform-velocity law of the course example (RC-M07-01)
  ok  [tablet] (the same two tests)
  ok  (all Milestone 2–6 tests at both sizes; tablet-menu test skipped at laptop width)
  1 skipped
  43 passed (45.7s)
[exit code: 0]
```

The first run's failures were all page-load timeouts, not wrong values; the rerun of the same
code passed in a third of the time (45.7 s against 2.1 min for e2e), so the machine was busy
during the first run. **Watch item:** with seven built laboratories the lazy page loads in the
parallel unit run are getting slower; if this recurs, the unit run should limit its workers or
load laboratories without the chart bundle in jsdom.

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, models 99.66 %, equations and
units 100 %.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                     | Resolution                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Flat-faced cam profile drawn on the wrong side** (contact offset sign): the profile overshot the follower by up to 5 mm | Contact at x = −ds/dθ for clockwise rotation; the reference test checks the profile height at seven angles |
| Wheel labels overlapped when gears are small and close (idler example, belt train)                                        | Labels that would collide move to a further row                                                            |
| Belt-train literal 33.333 rpm too coarse for the stated tolerance                                                         | Literal 33.3333 rpm                                                                                        |
| Test expectation slips (pressure angle at θ = 0 is 13.43°, not 0; direction parsing in a test)                            | Tests corrected; model values were right                                                                   |
| Interface strings first written into the lab component                                                                    | Moved to `content.en.ts` (D5)                                                                              |
| First full run: page-load timeouts under machine load                                                                     | Rerun passed unchanged (section 4); watch item recorded                                                    |

## 6. Open items for the owner's review

- **Course alignment:** L-9 (one gear-ratio convention, now stated on screen), L-19 (other cam
  laws and pressure angle marked as extensions), L-20 (pulley efficiency input marked as an
  extension) remain open.
- **Cam profile construction on a polar grid** is shown (the profile is drawn from the
  displacement) but not assessed automatically; the displacement table is assessed.
- **Torque through a train** is shown because the master instruction asks for it, labelled as an
  extension (the course gives only the qualitative statement).
- **Projector check:** still to be done in a real classroom.
