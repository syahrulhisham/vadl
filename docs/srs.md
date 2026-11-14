# Software requirements specification — VADL

Version 1.0 (Milestone 1), 14 November 2026. Derived from `docs/master-instruction.md` and the
approved `docs/project-plan.md` section 1. Decisions referenced as D1–D12 are in
`docs/decisions.md`.

## 1. Purpose and scope

VADL is a browser-based virtual laboratory of ten modules for BELK 3423 Actuator and Drives at
UTeM, used on laptops, desktops, tablets and classroom projectors. It complements the physical
laboratory and does not replace it.

Course alignment is **provisional**: no BELK 3423 materials have been examined yet (D2). See
`docs/course-alignment.md`.

## 2. Users

| User                       | Needs                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| Student (primary)          | Run experiments, record measurements, answer assessments, export a lab report |
| Lecturer or lab instructor | Demonstrate on a projector, set guided activities, read student reports       |
| Developer or maintainer    | Add or correct a module without touching the others                           |

A lecturer login, class roster and central marks store are outside the prototype scope.

## 3. Functional requirements

| ID    | Requirement                                                                                                                                                                                | Source      | Milestone   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------- |
| FR-01 | Dashboard: welcome page, laboratory overview, ten module entries, learning resources, experiment activities, assessment centre, student progress, laboratory reports                       | MI §6       | 2           |
| FR-02 | Every module presents seven regions: theory panel, simulation workspace, parameter controls, measurement dashboard, graph area, experiment instructions, assessment                        | MI §6       | 2           |
| FR-03 | Every module provides learning outcomes, theory, equations, an interactive diagram, a procedure, guided activities and problem-solving exercises                                           | MI §3 A–K   | 4–8         |
| FR-04 | Simulation controls: start, stop, pause, reset, adjustable simulation speed                                                                                                                | MI §3 G     | 3           |
| FR-05 | Parameters adjustable within validated ranges; out-of-range input rejected with an explanation in engineering terms                                                                        | MI §3 F, §5 | 3           |
| FR-06 | Measurements update in real time with units and sensible significant figures                                                                                                               | MI §3 H     | 3           |
| FR-07 | Graphs: time traces and characteristic curves with the current operating point marked                                                                                                      | MI §3 I     | 3           |
| FR-08 | Students record measurement rows into a results table; rows hold only simulation-produced values                                                                                           | MI §3 M, §8 | 3–4         |
| FR-09 | Three learning levels per module: beginner, intermediate, advanced                                                                                                                         | MI §7       | 4           |
| FR-10 | Assessment engine: multiple-choice, calculation with tolerance, seeded randomised numerical problems, troubleshooting challenges, immediate feedback, an explanation for each wrong answer | MI §7       | 4 (thin), 9 |
| FR-11 | Each question tagged with a module learning outcome and a learning level                                                                                                                   | MI §7       | 4           |
| FR-12 | Progress tracking per module: activities completed, assessment scores, reports generated                                                                                                   | MI §6       | 4 (thin), 9 |
| FR-13 | Report generator with the ten sections of MI §8, exported as PDF via the browser print dialog (D7)                                                                                         | MI §8       | 4 (thin), 9 |
| FR-14 | Each module states its model assumptions and limitations on screen and in reports                                                                                                          | MI §5       | 4–8         |
| FR-15 | Module-specific content as listed for Modules 1–10                                                                                                                                         | MI §4       | 4–8         |

Randomisation is used only to generate question parameters, from a seeded generator, so a
question can be reproduced. It is never used to produce a measurement.

## 4. Non-functional requirements

| ID     | Requirement             | Acceptance measure                                                                                       | Verified by                                           |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| NFR-01 | Engineering correctness | Every equation function has a unit test against a hand-calculated reference case with a stated tolerance | `tests/reference`, from M4                            |
| NFR-02 | Separation of concerns  | `src/sim-core` imports nothing from React, the DOM or upper layers; lint-enforced                        | `tests/unit/lint/sim-core-boundary.test.ts` (M1)      |
| NFR-03 | Responsiveness          | Usable from 768 px to 1920 px wide; touch targets ≥ 44 px; no horizontal scroll                          | Playwright laptop + tablet projects (M1 onward)       |
| NFR-04 | Projector legibility    | Measurement values ≥ 20 px; contrast ≥ 4.5:1                                                             | Design system tests, M2                               |
| NFR-05 | Performance             | 60 fps on a mid-range laptop; integration step independent of frame rate                                 | Engine tests, M3                                      |
| NFR-06 | Type safety             | TypeScript strict; no `any` in the simulation core                                                       | `npm run typecheck`, lint rule `no-explicit-any` (M1) |
| NFR-07 | Privacy                 | Student identification stays in the browser; nothing transmitted                                         | Architecture; no network code (M1)                    |
| NFR-08 | Security                | No secrets in frontend code or repository                                                                | `.gitignore`, `.env.example`, review (M1)             |
| NFR-09 | Maintainability         | A new module is added by registering one definition                                                      | Registry test (M1)                                    |
| NFR-10 | Accessibility           | Keyboard-operable controls; text alternatives for diagrams; colour never the only signal                 | Component tests, M2 onward                            |
| NFR-11 | Browser support         | Current Chrome, Edge, Firefox, Safari                                                                    | Playwright cross-browser, M10                         |
| NFR-12 | Honesty of model        | No screen or report describes the simulation as industrial-grade                                         | Smoke test checks the disclaimer (M1)                 |

## 5. Data and privacy

- Prototype storage is the browser's LocalStorage behind a `Repository` interface
  (`src/storage/types.ts`); keys `vadl.v1.*`.
- Student identification fields (D10): name, matric number, programme, section, lecturer name,
  date — entered by the student, never transmitted.
- Assessment scores are for self-study and formative feedback only (D11).

## 6. Out of scope for the prototype

- User accounts, lecturer dashboards, central storage of marks (Stage C, needs UTeM and PDPA 2010
  approval).
- Hardware-in-the-loop or connection to physical rigs.
- Free-form circuit building with arbitrary topologies.
- Field-oriented control, switching-loss models, compressible-flow dynamics.
