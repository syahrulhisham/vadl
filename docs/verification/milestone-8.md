# Verification report — Milestone 8

Pneumatics (M08, Lab 2), electro-pneumatics (M09, Lab 3) and electrohydraulics (M10, Labs 4a
and 4b). Branch `milestone-8` (from `milestone-7`), run on 15 November 2026, Windows 11 (12
logical processors), Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-8.md`. Models:
`docs/simulation-models/m08-pneumatics.md`, `m09-electro-pneumatics.md`,
`m10-electrohydraulics.md`. With this milestone all ten laboratories are built.

## 1. Gate

| Item                                      | Evidence                                                                                                                                                    | Result |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Course fluid-power values reproduced      | RC-M08-01, RC-M09-01, RC-M10-01: Festo forces (156.046, 169.646, 142.503 N), coil values, load pressure 0.75 MPa, speeds, ratios, back pressure, powers     | Pass   |
| VADL flow models behave as stated         | RC-M08-02 (choked meter-out 0.290884 m/s, load-independent; meter-in load-dependent; intensification), RC-M10-02 (relief, gravity lowering, raise 1.40 MPa) | Pass   |
| Ladder logic                              | RC-M09-02: indirect control, dominant-reset latch, Part D order 1A1+ 2A1+ 1A1− 2A1− (simulated end to end)                                                  | Pass   |
| Laboratories in a real browser            | Chromium, laptop and tablet: Lab 2 AND with memory (3.5 bar gauge); Lab 3 Part D sequence; Lab 4a Ex 2 lowering, raising, 5 MPa and 2 L/min over relief     | Pass   |
| Connection and troubleshooting activities | Ladder editor turns Part A into an AND circuit; hidden fault inserted without being shown; diagnosis checked                                                | Pass   |
| Earlier laboratories unchanged            | All Milestone 1–7 tests pass                                                                                                                                | Pass   |
| All checks                                | Section 4                                                                                                                                                   | Pass   |

## 2. What was built

| Area                  | Files                                                                                   | Notes                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fluid-power equations | `src/sim-core/equations/fluidPower.ts`                                                  | Areas, course forces (10 % friction, spring); compressible and incompressible orifice flow; pneumatic, spring-return and hydraulic stroke solvers; pump, relief, powers; coils |
| Logic                 | `src/sim-core/logic/ladder.ts`, `pneumaticLogic.ts`                                     | Relay ladder with settling, chatter detection, timer, eight faults, seven presets; Lab 2 signal networks with shuttle, dual-pressure and memory valves                         |
| Models                | `models/pneumatics.ts`, `electroPneumatics.ts`, `hydraulics.ts`, `pneumaticCylinder.ts` | Lab 2 circuits; two cylinders under a ladder; Lab 4a/4b circuits on the 16/10/200 cylinder with the 9 kg load                                                                  |
| Shared UI             | `src/features/fluid-power/*`                                                            | Momentary push button, lamps, cylinder, ladder diagram, signal chain                                                                                                           |
| Laboratories          | `src/modules/m08-pneumatics`, `m09-electro-pneumatics`, `m10-electrohydraulics`         | Content, 8 + 7 + 8 original questions, reports, activities; M09 ladder editor and hidden-fault exercise                                                                        |
| Units                 | `mpaToPa`, `paToMpa`, `cm2ToM2`, `cm3ToM3`                                              | Conversions kept in `sim-core/units`                                                                                                                                           |
| Test configuration    | `vitest.config.ts` (6 workers), `playwright.config.ts` (3 workers)                      | See section 5                                                                                                                                                                  |

Questions are original to VADL; no examination material is used. Lab 4b Exercise 2 follows the
UTeM sequence (buttons raise, switch lowers, otherwise hold), pending lecturer question L-24.

## 3. Tests

| File                                     | Tests          | Covers                                                                                                                                                                             |
| ---------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/reference/fluid-power.test.ts`    | 16             | RC-M08-01 to RC-M10-02                                                                                                                                                             |
| `tests/unit/sim-core/fluidPower.test.ts` | 21             | Orifice helpers, spring stall, dead-head and cavitation; Lab 2 logic; M08 circuits; ladder chatter and all faults; M09 Part C, timer, currents; M10 circuits, relief, OR/AND/latch |
| `tests/unit/sim-core/units.test.ts`      | +1             | MPa conversions                                                                                                                                                                    |
| `tests/unit/app/m08m09m10Labs.test.tsx`  | 12             | Seven regions; course forces on screen; push buttons and signal lamps; S1 current direct/indirect; ladder editor AND; hidden fault; hydraulic values; AND platform; question banks |
| `routes`, `dcLab`, `home.spec`           | updated        | Placeholder layout now tested directly on `LabShell`; all ten modules built; ten report links; NFR-04 checks a built lab's reading                                                 |
| `tests/e2e/fluid-power-labs.spec.ts`     | 3 × 2 projects | Lab 2, Lab 3 Part D, Lab 4a Ex 2 end to end; no overflow, no console errors                                                                                                        |

Total: 531 unit and reference tests; 49 Playwright runs passed, 1 skipped by design.

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
 Test Files  44 passed (44)
      Tests  531 passed (531)
   Duration  32.98s
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/logic    |   97.14 |    96.36 |     100 |   98.21 |
 sim-core/models   |   97.94 |    92.07 |   99.32 |   98.38 |
Statements   : 93.01% ( 3820/4107 )
Branches     : 86.52% ( 2241/2590 )
Functions    : 84.12% ( 1081/1285 )
Lines        : 93.17% ( 3484/3739 )
[exit code: 0]
=================== npm run build
dist/assets/PneumaticsLab-BV8q2y38.js           8.05 kB │ gzip:   2.86 kB
dist/assets/HydraulicsLab-DRwgfHuL.js           9.08 kB │ gzip:   3.16 kB
dist/assets/ElectroPneumaticsLab-DrD-DZhp.js   10.80 kB │ gzip:   3.54 kB
dist/assets/index-nwW3VtMY.js                 143.95 kB │ gzip:  47.29 kB
dist/assets/graphs-DPeyUKXV.js                385.48 kB │ gzip: 110.36 kB
✓ built in 4.30s
[exit code: 0]
=================== npm run test:e2e   (first run, default 6 workers)
  2 failed  (dc-lab tablet tests: 1 min timeouts while waiting for a recorded row)
  1 skipped
  47 passed (2.2m)
=================== npm run test:e2e   (after limiting Playwright to 3 workers; run twice)
  ok  [laptop] pneumatics: AND with memory — extends on 1S1 at the begin position, holds, 1S2 returns
  ok  [laptop] electro-pneumatics: Part D runs the sequence 1A1+ 2A1+ 1A1− 2A1− (RC-M09-02)
  ok  [laptop] electrohydraulics: Lab 4a Ex 2 lowers by the weight, raises with the pump to the relief at the end
  ok  [tablet] (the same three tests)
  ok  (all earlier tests at both sizes; tablet-menu test skipped at laptop width)
  1 skipped
  49 passed (1.9m)      second run: 49 passed (2.0m)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, logic 98.21 %, models 98.38 %,
equations and units 100 %.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                                                              | Resolution                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pneumatic speed model degenerate when the exhaust is choked** (first prototype gave exhaust pressures of 48 bar): flow and density both scale with pressure      | Reformulated: exhaust pressure from the force balance, speed from continuity (single decreasing root); closed-form choked case in RC-M08-02       |
| **Test suites timing out under load** (the Milestone 7 watch item, worse with ten laboratories): lazy page loads in the unit run, recorded rows in the browser run | Unit run limited to 6 workers (it also became faster: 33 s instead of about 80 s); Playwright limited to 3 workers; both suites passed repeatedly |
| Push button did nothing when the browser could not capture the pointer                                                                                             | Pointer capture made optional                                                                                                                     |
| Conversions written in the UI and questions (×1000, ×1e−4, ×1e−6)                                                                                                  | MPa, cm² and cm³ conversions added to `sim-core/units`; existing ones used                                                                        |
| Placeholder tests had no planned module left                                                                                                                       | Placeholder layout tested directly; test that all ten modules are built                                                                           |
| Interface strings first written in components                                                                                                                      | Moved to the content files (D5)                                                                                                                   |

## 6. Open items for the owner's review

- **Lecturer questions:** L-17 (air consumption), L-18 (10 % friction used as the course
  default, ideal case available by setting friction to 0), L-21 (pneumatic stroke: 100 mm
  assumed), L-22 (pressure limit 6 bar used), L-23 (IEC current-path ladder shown), L-24 (Lab 4b
  Ex 2 sequence).
- **VADL's own speed and pressure models** are stated as such on screen; the hydraulic passage
  is calibrated to one course measurement (0.05 MPa at 2 L/min).
- **Milestone 9** (assessment centre, cross-module progress, complete reports) and Milestone 10
  (integration, documentation, deployment) remain.
- **Projector check:** still to be done in a real classroom.
