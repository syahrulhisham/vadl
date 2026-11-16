# Verification report — Milestone 11

Concepts from the owner's earlier interactive labs. Branch `milestone-11` (from `main` at
`80e3303`), run on 16 November 2026, Windows 11 (build 10.0.26300), Node v24.21.0, npm 11.19.0.
Plan: `docs/milestones/milestone-11.md`.

## 1. Gate

| Item                                   | Evidence                                                                                                 | Result |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| D3 record corrected                    | Dated correction in `docs/decisions.md`; the earlier note is kept                                        | Done   |
| Operating-principle sequence (M01)     | Eight steps; values beside the drawing are model outputs (unit and browser tests)                        | Pass   |
| Construction explorers (M01, M04, M05) | Chosen part highlighted in the diagram and described (unit and browser tests)                            | Pass   |
| Encoder decoding and resolver (M05)    | RC-M05-06, -07; resolver closes the position loop in a browser                                           | Pass   |
| Hybrid stepper formula (M04)           | RC-M04-06: Nr 50 → 1.8°, Nr 100 → 0.9°                                                                   | Pass   |
| Drive waveforms (M01)                  | RC-M01-06 to -09: full, semi and half-wave converters, continuous and discontinuous conduction           | Pass   |
| Dual converter, regeneration, quadrant | RC-M01-10, -11                                                                                           | Pass   |
| AC two-phase servo (M05)               | RC-M05-08; reaches 90° in a browser                                                                      | Pass   |
| Seven regions in every laboratory      | Unit and browser tests in each new view and after a run                                                  | Pass   |
| Accessibility                          | Existing audit of 20 pages, plus axe on the new M01 views and the servo laboratory after a run           | Pass   |
| Projector and grid checks              | 14 meter grids at 1024, 1280, 1366 and 1920 px, including the new waveform view and the new servo meters | Pass   |
| All checks                             | Section 4                                                                                                | Pass   |

## 2. What was built

| Area            | Files                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Drive waveforms | `src/sim-core/equations/driveWaveforms.ts`, `src/modules/m01-dc-motor/DriveScope.tsx`             |
| Principle       | `src/modules/m01-dc-motor/OperatingPrinciple.tsx`; three workspace views in `DcMotorLab.tsx`      |
| Parts explorer  | `src/features/lab-shell/PartsExplorer.tsx`; `highlight` on the stepper and servo diagrams         |
| Servo           | `equations/servo.ts`, `models/servoMotor.ts`, `m05-servo/SensorChain.tsx`, `ServoLab.tsx`         |
| Stepper         | `equations/stepper.ts`, `models/stepperMotor.ts`, `m04-stepper/StepperLab.tsx`                    |
| Charts          | `TimeTraceChart`: optional `xLabel`                                                               |
| Documents       | Reference cases `drive-waveforms.md` (new), `servo-motor.md`, `stepper-motor.md`; model documents |

## 3. Tests

| File                                       | Tests       | Covers                                                  |
| ------------------------------------------ | ----------- | ------------------------------------------------------- |
| `tests/reference/drive-waveforms.test.ts`  | 16          | RC-M01-06 to -11, gate angles, quadrants                |
| `tests/reference/servo-sensors-ac.test.ts` | 12          | RC-M05-06 to -08, sensors in the loop                   |
| `tests/reference/stepper-motor.test.ts`    | +3          | RC-M04-06                                               |
| `tests/unit/app/m11Features.test.tsx`      | 12          | The new views, explorers and options in each laboratory |
| `tests/e2e/milestone-11.spec.ts`           | 4 × 2 sizes | The same in a real browser, with charts and axe         |
| `tests/e2e/projector.spec.ts`              | updated     | New meters listed; the waveform view's grid checked     |

Totals: 602 unit and reference tests (559 before); 165 Playwright runs at laptop and tablet size
(157 before), 83 skipped by design.

## 4. Command output (actual, abridged)

```text
npm run typecheck        exit 0
npm run lint             exit 0 (zero warnings)
npm run format:check     All matched files use Prettier code style!
npm run test:coverage
 Test Files  51 passed (51)
      Tests  602 passed (602)
   Duration  33.70s
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/logic    |   97.97 |    96.96 |     100 |   98.75 |
 sim-core/models   |   97.79 |    92.14 |   99.33 |   98.21 |
Statements   : 93.09% ( 4574/4913 )
Lines        : 93.28% ( 4143/4441 )
npm run build            ✓ built
npm run test:e2e  run 1  165 passed, 83 skipped (2.3m)
npm run test:e2e  run 2  165 passed, 83 skipped (2.4m)
integration.spec.ts in Edge and WebKit   22 passed
npm run test:e2e:base    2 passed
```

Simulation-core gate (≥ 90 % of lines): met.

## 5. Issues found during the milestone

| Issue                                                                                                 | Resolution                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Average voltages 0.25 % low in the first waveform tests                                               | The averages were taken from 0.5° samples across the jump at each firing; now integrated on the fine grid         |
| A test claimed converter 1 of a dual converter passes no current when its average voltage is below Eg | Wrong physics in the test: it passes positive pulses whenever vs > Eg. The test now checks it never goes negative |
| The parts explorer added an eighth landmark region                                                    | Rendered as a named group                                                                                         |
| **Existing defect:** after a servo run the step-response panel was an eighth region                   | The panel is now a named group; found by the new browser test                                                     |
| A lint rule read a field named `current` as a React ref                                               | The array is read by key in `DriveScope.tsx`                                                                      |
| **First full verification run was unreliable**                                                        | See below                                                                                                         |

**First verification run.** The first full run reported 8 unit failures and 21, then 2, browser
failures, with the browser suite taking 30 and 11 minutes instead of about 2. Every failure was a
page-load timeout and different tests failed in each run. Other applications were using the
machine at the time. On the quiet machine the same code gave the results in section 4, twice. The
loaded runs are recorded here because they happened; they are not counted as passes or as
defects.

## 6. Limits and open items

- The drive-waveform view is a periodic steady state at the present speed. The laboratory's
  dynamic model still uses the average converter voltage.
- Items built as extensions pending the lecturer: hybrid formula (L-15), drive waveforms and dual
  converter (L-5, L-13), AC servo and sensor decoding (L-16).
- No new assessment questions or report columns were added for these features.
- Firefox was not run locally (it does not start on this machine); CI covers it after a push.
  Ubuntu CI has not run on this branch.
- The work is uncommitted on `milestone-11`; nothing is pushed, tagged or deployed.
- Still outstanding from before: the classroom projector check, D4 bench data, D12 hosting, the
  lecturer's answers.
