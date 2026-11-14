# VADL Project Plan: Virtual Actuator and Drives Laboratory

Nov 14, 2026 · @Syahrul Hisham

## Summary

This is the planning deliverable only. No code is written until you approve Milestone 1.

The recommended approach is a React + TypeScript + Vite single-page application with a pure-TypeScript simulation core that has no dependency on the user interface. Every measurement shown to a student comes from a documented equation or a numerical integration of one, and each is checked by an automated test against a hand-calculated reference case.

Three things need your attention before work starts:

- **No BELK 3423 course materials have been examined.** Learning outcomes, notation and lab procedures in this plan are provisional until lecture notes, lab sheets or the course outline are supplied. Nothing here claims syllabus alignment.
- **The development environment must be decided.** The project rules require a Git repository, branches, commits, Vitest and Playwright. That workflow needs a persistent repository; a chat session's workspace does not persist between tasks. See decision D1.
- **Twelve decisions are listed in the last section**, each with a recommendation. Approving the recommendations as they stand is enough to start Milestone 1.

## 1. Software requirements specification

VADL is a browser-based virtual laboratory of ten modules for BELK 3423 Actuator and Drives at UTeM, used on laptops, desktops, tablets and classroom projectors. It complements the physical laboratory and does not replace it.

### Users

| User | Needs |
| --- | --- |
| Student (primary) | Run experiments, record measurements, answer assessments, export a lab report |
| Lecturer or lab instructor | Demonstrate on a projector, set guided activities, read student reports |
| Developer or maintainer | Add or correct a module without touching the others |

A lecturer login, class roster and central marks store are outside the prototype scope. They belong to the database upgrade in section 4.

### Functional requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-01 | Dashboard with welcome page, laboratory overview, ten module entries, learning resources, experiment activities, assessment centre, student progress and laboratory reports | Instruction 6 |
| FR-02 | Every module presents the same seven regions: theory panel, simulation workspace, parameter controls, measurement dashboard, graph area, experiment instructions, assessment | Instruction 6 |
| FR-03 | Every module provides learning outcomes, theory, equations, an interactive diagram, a procedure, guided activities and problem-solving exercises | Instruction 3 A–K |
| FR-04 | Simulation controls: start, stop, pause, reset, plus adjustable simulation speed | Instruction 3 G |
| FR-05 | Parameters are adjustable within validated ranges; out-of-range input is rejected with an explanation in engineering terms | Instruction 3 F, 5 |
| FR-06 | Measurements update in real time with units and sensible significant figures | Instruction 3 H |
| FR-07 | Graphs: time traces and characteristic curves (for example torque–speed), with the current operating point marked | Instruction 3 I |
| FR-08 | Students record measurement rows into a results table; rows hold only values the simulation produced | Instruction 3 M, 8 |
| FR-09 | Three learning levels per module: beginner, intermediate, advanced | Instruction 7 |
| FR-10 | Assessment engine: multiple-choice, calculation with tolerance, randomised numerical problems, troubleshooting challenges, immediate feedback and an explanation for each wrong answer | Instruction 7 |
| FR-11 | Each question is tagged with a module learning outcome and a learning level | Instruction 7 |
| FR-12 | Progress tracking per module: activities completed, assessment scores, reports generated | Instruction 6 |
| FR-13 | Report generator with the ten sections in Instruction 8, exported as PDF | Instruction 8 |
| FR-14 | Each module states its model assumptions and limitations on screen | Instruction 5 |
| FR-15 | Module-specific content as listed for Modules 1 to 10 | Instruction 4 |

Randomisation is used only to generate question parameters, from a seeded generator so a question can be reproduced. It is never used to produce a measurement.

### Non-functional requirements

| ID | Requirement | Acceptance measure |
| --- | --- | --- |
| NFR-01 | Engineering correctness | Every equation function has a unit test against a hand-calculated reference case; stated tolerance per case |
| NFR-02 | Separation of concerns | Files under the simulation core import nothing from React or the DOM; enforced by a lint rule |
| NFR-03 | Responsiveness | Usable from 768 px width (tablet portrait) to 1920 px; touch targets at least 44 px |
| NFR-04 | Projector legibility | Measurement values at least 20 px; contrast ratio at least 4.5:1 |
| NFR-05 | Performance | Simulation holds 60 frames per second on a mid-range laptop; integration step independent of frame rate |
| NFR-06 | Type safety | TypeScript strict mode; no `any` in the simulation core |
| NFR-07 | Privacy | Student identification stays in the browser in the prototype; nothing is transmitted |
| NFR-08 | Security | No secrets in frontend code or the repository; environment variables for any future keys |
| NFR-09 | Maintainability | A new module is added by registering one module definition; no edits to shared code |
| NFR-10 | Accessibility | Keyboard-operable controls; diagrams carry text alternatives; colour is never the only signal |
| NFR-11 | Browser support | Current Chrome, Edge, Firefox and Safari |
| NFR-12 | Honesty of model | No screen or report describes the simulation as industrial-grade |

### Out of scope for the prototype

- User accounts, lecturer dashboards and central storage of marks.
- Hardware-in-the-loop or connection to physical rigs.
- Free-form circuit building with arbitrary topologies; circuit activities use defined connection points.
- Field-oriented control, switching-loss models and compressible-flow dynamics.

## 2. System architecture

VADL is a client-only single-page application in four layers; dependencies point downward only, and the simulation core depends on nothing.

&#91;embedded content: VADL architecture · 4 layers\]

The interface never computes an engineering value. It sends parameters to a service, which runs the core and returns measurements with units attached.

### Simulation core contract

Every dynamic module implements one interface, so the engine, recorder, graphs and report generator work with all ten modules unchanged.

```ts
interface SimModel<P, S, O> {
  id: string;
  defaults: P;                              // parameters, SI units
  validate(p: P): Issue[];                  // range and consistency checks
  init(p: P): S;                            // initial state vector
  derivatives(t: number, s: S, p: P): S;    // dS/dt, the state equations
  outputs(t: number, s: S, p: P): O;        // measurements derived from state
  assumptions: string[];                    // shown to the student
}
```

Static modules (mechanical transmission, converter averages) implement only `validate` and `outputs`. Logic modules (valves, relay circuits) use a discrete-event variant with a `step(inputs, state)` function.

### Design rules

- **Fixed time step.** The engine advances in fixed steps using an accumulator, independent of the screen frame rate, so results are the same on every device.
- **SI units inside, display units at the edge.** The core works in rad/s, N·m, Pa and m³/s. Conversion to rpm, bar and L/min happens in one formatting module.
- **Module registry.** Each laboratory is one definition object: metadata, learning outcomes, model, controls, measurements, graphs, activities and question bank. The dashboard, progress and report features read the registry.
- **Recorded data only.** The report generator reads the measurement rows a student recorded and the traces the engine produced. It has no path to create values of its own.
- **Lazy loading.** Each module is a separate bundle, loaded when opened.

### Technology choices

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | React 18, TypeScript strict, Vite | As specified |
| Styling | Tailwind CSS with design tokens | Navy, light blue and white theme in one place |
| Routing | React Router | One route per dashboard area and module |
| State | React context and reducers; no state library at first | Avoids an unnecessary dependency |
| Diagrams | SVG first; Canvas for dense waveforms | SVG prints cleanly into PDF reports |
| 3D | Three.js deferred | See decision D8 |
| Graphs | Recharts | As specified |
| PDF export | Print stylesheet and the browser's Save as PDF | No dependency; see decision D7 |
| Tests | Vitest for unit and component, Playwright for end-to-end | As specified |

## 3. Folder structure

The structure mirrors the four layers, with the simulation core in its own top-level folder under `src` so the no-UI-imports rule can be enforced by path.

```text
vadl/
├── CLAUDE.md                     project memory: conventions, commands, status
├── README.md
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json                 strict mode
├── .env.example                  no real keys committed
├── docs/
│   ├── srs.md
│   ├── architecture.md
│   ├── simulation-models/        one file per module: equations, assumptions, limits
│   ├── reference-cases/          hand calculations behind each verification test
│   └── course-alignment.md       filled only from examined BELK 3423 materials
├── public/
├── src/
│   ├── main.tsx
│   ├── app/                      shell, routes, layout, providers
│   ├── design-system/            tokens, buttons, panels, meters, sliders, icons
│   ├── sim-core/                 NO React or DOM imports
│   │   ├── engine/               clock, integrators (euler, rk4), recorder
│   │   ├── units/                SI types, conversions, formatting
│   │   ├── equations/            pure documented functions, grouped by domain
│   │   │   ├── dc-machines.ts
│   │   │   ├── induction-machines.ts
│   │   │   ├── converters.ts
│   │   │   ├── stepper.ts
│   │   │   ├── control.ts
│   │   │   ├── transmission.ts
│   │   │   ├── cams.ts
│   │   │   └── fluid-power.ts
│   │   ├── models/               SimModel implementations built on equations
│   │   └── logic/                valve states, relay-ladder evaluator, sequences
│   ├── modules/                  one folder per laboratory
│   │   ├── registry.ts
│   │   ├── m01-dc-motor/
│   │   │   ├── definition.ts     metadata, outcomes, controls, measurements
│   │   │   ├── theory.tsx
│   │   │   ├── Workspace.tsx     diagram and animation
│   │   │   ├── activities.ts     guided and independent experiments
│   │   │   └── questions.ts      question bank tagged by outcome and level
│   │   ├── m02-ac-motor/
│   │   ├── m03-power-converters/
│   │   ├── m04-stepper/
│   │   ├── m05-servo/
│   │   ├── m06-transmission/
│   │   ├── m07-cam-follower/
│   │   ├── m08-pneumatics/
│   │   ├── m09-electro-pneumatics/
│   │   └── m10-electrohydraulics/
│   ├── features/
│   │   ├── lab-shell/            the seven-region module layout
│   │   ├── graphs/               time-trace and characteristic-curve components
│   │   ├── assessment/           engine, seeded generator, marking, feedback
│   │   ├── reports/              report model, print layout, export
│   │   ├── progress/
│   │   └── resources/
│   ├── storage/                  repository interface, LocalStorage adapter, schema versions
│   └── hooks/                    useSimulation, useRecorder, useProgress
└── tests/
    ├── unit/                     mirrors src/sim-core and features
    ├── reference/                verification against docs/reference-cases
    └── e2e/                      Playwright flows
```

## 4. Database and storage strategy

The prototype stores everything in the browser's LocalStorage behind a repository interface, so moving to a database later replaces one adapter and no feature code.

### Prototype

| Stored item | Key | Contents |
| --- | --- | --- |
| Student profile | `vadl.v1.profile` | Name, matric number, programme, section (entered by the student) |
| Progress | `vadl.v1.progress` | Per module: activities completed, level reached, last opened |
| Experiment sessions | `vadl.v1.sessions.<module>` | Parameters used, recorded measurement rows, timestamps |
| Assessment attempts | `vadl.v1.attempts.<module>` | Question id, seed, answer given, mark, time |
| Reports | `vadl.v1.reports.<id>` | Student-written discussion and conclusion, links to sessions and attempts |
| Settings | `vadl.v1.settings` | Learning level, display units, simulation speed |

- Every record carries a schema version; a migration function runs on load when the version changes.
- Graph traces are regenerated from saved parameters, not stored, which keeps storage well under the browser limit of about 5 MB.
- Students can export and import their data as a JSON file to move between devices, and can clear it.

### Limits you should know

- Data stays on one browser on one device and is lost if the browser data is cleared.
- LocalStorage is editable by the student, so prototype assessment scores are suitable for self-study, not for official marks.

### Upgrade path

1. **Stage A, prototype:** LocalStorage adapter only. No personal data leaves the device.
2. **Stage B, optional backup:** JSON export and import, already included.
3. **Stage C, database:** a backend with authentication, a relational database and row-level access so a student sees only their own records and a lecturer sees their class. Marking moves to the server so scores cannot be edited.

Stage C involves student personal data, so it needs UTeM approval on hosting, login method and compliance with the Personal Data Protection Act 2010 before any design work. It is outside the ten milestones unless you add it.

## 5. Engineering simulation strategy

Every displayed value is the output of a named equation function or a numerical integration of state equations; no random or cosmetic values are used for measurements.

### Principles

1. **Equations are pure functions.** Each takes SI inputs, returns SI outputs, and carries a comment block with the formula, symbols, units, assumptions and source.
2. **Three model classes.** Dynamic (ordinary differential equations), static (algebraic steady state) and logic (discrete states). Each module uses the simplest class that teaches the concept correctly.
3. **Integration method.** Fourth-order Runge-Kutta is the default for dynamic models. Forward Euler is also provided so students can compare the two as a learning activity.
4. **Step size rule.** The step is at most one tenth of the fastest time constant. For the DC motor that is the electrical constant La/Ra, checked whenever a parameter changes.
5. **Validation before simulation.** Parameters outside physical limits (zero inertia, duty cycle at 1 for a boost converter, pressure above relief setting) are rejected with an explanation.
6. **Stated limitations.** Each module shows its assumptions next to the simulation and repeats them in the report.

### Core dynamic model: DC motor

```latex
V_a = E_b + I_a R_a + L_a \frac{dI_a}{dt}, \qquad E_b = K_e\,\omega, \qquad T_e = K_t\,I_a, \qquad J\frac{d\omega}{dt} = T_e - T_L - B\,\omega
```

The state vector is armature current and angular velocity. Speed is displayed as both rad/s and rpm, with n = 60ω/(2π). In SI units Ke and Kt are numerically equal, and the model enforces that.

### Models by module

| Module | Class | Model and main relationships | Stated limitations |
| --- | --- | --- | --- |
| 1. DC motor drives | Dynamic | Two-state armature and rotor model. Separately excited: flux set by field current. Shunt: field current Vt/Rf. Series: flux proportional to armature current, so Te = K·Ia² and Eb = K·Ia·ω. Starting current, armature-voltage and field control. Efficiency = shaft power / (armature + field input) | Linear magnetic circuit unless saturation curve supplied; no armature reaction; brush drop neglected; ideal DC supply |
| 2. AC motor drives | Static torque, dynamic rotor | ns = 120f/P; s = (ns − nr)/ns; torque from the per-phase equivalent circuit using the Thévenin form; rotor speed from J dω/dt = Te − TL − Bω; constant V/f with low-frequency voltage boost | Electrical transients neglected; balanced sinusoidal supply; constant parameters; no field-oriented control |
| 3. Power converters | Static averages, computed waveforms | Rectifiers: single-phase full-wave Vdc = 2Vm/π, three-phase bridge Vdc = 1.35 V(line rms), controlled versions multiplied by cos α. Buck Vo = D·Vin; boost Vo = Vin/(1 − D); inductor ripple and continuous-conduction boundary. Inverters: square-wave and sinusoidal PWM from carrier comparison, fundamental and THD | Ideal switches and diodes; continuous conduction unless flagged; no switching or conduction losses; no dead time |
| 4. Stepper motors | Logic, with optional rotor dynamics | Phase sequence tables for full-step, half-step and microstepping; step angle = 360° / steps per revolution; speed (rpm) = step angle × pulse rate × 60 / 360; position by step count and direction | No missed steps or resonance in the base model; pull-out torque curve only if motor data is supplied |
| 5. Servo motors | Dynamic, closed loop | DC motor plant plus position state, PID controller with output saturation and anti-windup; error = reference − feedback; rise time, overshoot, settling time and steady-state error measured from the response | Ideal sensor; no backlash or Coulomb friction unless enabled; continuous-time controller |
| 6. Mechanical transmission | Static | Gear ratio G = N(driven)/N(driver); ω(out) = ω(in)/G; T(out) = η·G·T(in); compound trains as a product of stage ratios; belts by pulley diameter ratio; chains by sprocket teeth ratio | Rigid bodies; no belt slip unless a slip factor is set; constant efficiency per stage |
| 7. Cam and follower | Static kinematics | Displacement, velocity and acceleration for uniform velocity, simple harmonic, cycloidal and parabolic motion over rise, dwell and return; cam profile by inversion; pitch curve for roller follower; pressure angle | Rigid cam and follower; no jump or spring dynamics; radial follower, offset optional |
| 8. Pneumatics | Logic plus quasi-static | Valve positions as discrete states with port connectivity; extend force F = p·A − spring − friction; retract area A − rod area; piston speed set by flow-control restriction; regulator sets working pressure | Air compressibility and pressure build-up dynamics not modelled; constant supply; no leakage |
| 9. Electro-pneumatics | Logic | Relay-ladder evaluator scanned in fixed cycles: push buttons, relays with latching, solenoids, reed and limit switches; sequences such as A+ B+ A− B−; injected faults for troubleshooting | Ideal contacts with no bounce; cylinders reuse the Module 8 model |
| 10. Electrohydraulics | Quasi-static | Pump flow Q = displacement × speed × volumetric efficiency; v = Q/A; pressure = load force / area, limited by the relief valve setting; hydraulic power = p·Q; meter-in flow control; solenoid directional valve states | Incompressible fluid; no line losses or leakage unless enabled; constant pump speed |

Symbols and notation above follow common textbook usage. They will be changed to match the BELK 3423 lecture notes once those are supplied, including the stepper step-angle convention for each motor type.

### What the simulation is not

VADL is a simplified educational model. It is not a substitute for circuit-level tools such as MATLAB/Simulink or PSIM, or for fluid-power design software, and no screen or report will describe it as such.

## 6. Laboratory module development sequence

The modules are built in the order of the ten milestones, one module at a time, because each stage produces something the next one reuses.

1. **Milestone 1: requirements, architecture, project structure.** Gate: repository builds, lints and runs an empty test suite.
2. **Milestone 2: dashboard, navigation, design system.** Gate: all eight dashboard areas reachable; module pages show the seven-region layout with placeholders.
3. **Milestone 3: simulation engine and graphing.** Gate: integrators pass analytic tests; a first-order RL circuit runs end to end as the proving model.
4. **Milestone 4: DC motor laboratory, complete.** This is the reference module. It is taken all the way through theory, simulation, activities, assessment and a draft report so the pattern is proven once. Gate: your review of the full module before any other is started.
5. **Milestone 5: AC motor, then power converters.** Reuses the rotor dynamics and adds the waveform display.
6. **Milestone 6: stepper, then servo.** The servo module reuses the DC motor plant from Milestone 4.
7. **Milestone 7: mechanical transmission, then cam and follower.** Static models with new mechanism animations.
8. **Milestone 8: pneumatics, then electro-pneumatics, then electrohydraulics.** Pneumatics builds the valve and cylinder logic; electro-pneumatics adds the relay evaluator; electrohydraulics reuses both.
9. **Milestone 9: assessment centre, progress, report generation.** The engines exist from Milestone 4; this milestone completes question banks, cross-module progress and PDF reports for all ten.
10. **Milestone 10: integration testing, documentation, deployment.**

One change to the written sequence is recommended: build a thin version of the assessment and report features inside Milestone 4, not first in Milestone 9. Otherwise nine modules would be built before the report format is tested once. See decision D9.

## 7. Testing and verification strategy

No feature is reported as working until its automated tests pass, and every engineering function is tested against a value calculated by hand, independently of the code.

### Test levels

| Level | Tool | What it proves |
| --- | --- | --- |
| Equation unit tests | Vitest | Each formula returns the hand-calculated value within tolerance |
| Integrator tests | Vitest | Euler and RK4 match analytic solutions; error falls at the expected order as the step halves |
| Model tests | Vitest | Steady state of the dynamic model equals the algebraic solution; power balance holds |
| Physical invariants | Vitest | Output power never exceeds input; gear power is conserved at 100% efficiency; slip stays within 0 to 1 in motoring |
| Logic tests | Vitest | Valve and relay truth tables; full sequence traces for cylinder circuits |
| Component tests | Vitest with Testing Library | Controls respect limits; measurements show correct units and rounding |
| End-to-end | Playwright | Run an experiment, record rows, answer questions, export a report; at laptop and tablet sizes |
| Assessment tests | Vitest | A seeded question always produces the same numbers; the marking key equals the equation function's answer |

### Reference cases

These are the first verification cases, worked by hand from the formulas in section 5. Each will be written up in `docs/reference-cases` with full working before its test is written.

| Module | Inputs | Expected result |
| --- | --- | --- |
| DC motor, separately excited | Va = 220 V, Ra = 0.5 Ω, Kφ = 1.2 V·s/rad, TL = 24 N·m, B = 0 | Ia = 20 A; Eb = 210 V; ω = 175 rad/s = 1671.1 rpm; armature efficiency 95.45% |
| Integrator, RL circuit | Step input, t = one time constant | Current = 63.21% of final value |
| Induction motor | 4 poles, 50 Hz, rotor at 1440 rpm | ns = 1500 rpm; slip = 0.04 |
| Variable frequency drive | 4 poles, 30 Hz | ns = 900 rpm |
| Single-phase full-wave rectifier | 230 V rms | Average output 207.1 V |
| Three-phase bridge rectifier | 400 V line rms | Average output 540.2 V |
| Buck converter | Vin = 48 V, D = 0.4, L = 1 mH, fs = 20 kHz | Vo = 19.2 V; inductor ripple 0.576 A |
| Boost converter | Vin = 12 V, D = 0.6 | Vo = 30 V |
| Stepper motor | 200 steps/rev, 1000 pulses/s, full step | Step angle 1.8°; 300 rpm (150 rpm in half step) |
| Servo, second-order check | Damping ratio 0.5 | Overshoot 16.3% |
| Gear pair | 20 teeth driving 60 teeth, 1500 rpm, 10 N·m, 100% efficiency | 500 rpm; 30 N·m |
| Cam, simple harmonic rise | Lift 40 mm over 120°, at 30° | Displacement 5.858 mm |
| Pneumatic cylinder | Bore 50 mm, rod 20 mm, 6 bar gauge, no friction | Extend force 1178 N; retract force 990 N |
| Hydraulic cylinder | Bore 63 mm, 10 L/min, 100 bar | Speed 53.5 mm/s; force 31.17 kN; hydraulic power 1.667 kW |

Where the course materials contain worked examples, those become additional reference cases and take priority over the ones above.

### Quality gates per milestone

- Type check, lint and all tests pass before a commit to the main branch.
- Simulation core coverage of at least 90% of lines; every exported equation has at least one reference test.
- A verification report is added to the documentation at each milestone, listing each case, the expected value, the computed value and the difference.
- A second pass on one model per milestone compares results with an independent tool or published textbook example, where one is available.

## 8. Development risk assessment

The two risks most likely to damage the project are content that does not match the course as taught, and scope: ten full laboratories each with fourteen required elements.

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Content, notation or outcomes differ from BELK 3423 as taught, because no course materials have been examined | High | High | Supply lecture notes and lab sheets before Milestone 4; keep outcomes in data files marked provisional until confirmed |
| R2 | Scope: 10 modules × 14 elements is about 140 content units plus shared features | High | High | One module at a time; a reference module first; agree a minimum per module before adding depth |
| R3 | An equation or sign error reaches students | Medium | High | Hand-worked reference cases; invariant tests; your review of each model document before release |
| R4 | Numerical instability at extreme parameter values | Medium | Medium | Step-size rule tied to the fastest time constant; parameter validation; RK4 default |
| R5 | Students treat a simplified model as exact | Medium | Medium | Assumptions shown beside every simulation and in every report |
| R6 | Electro-pneumatic circuit building is far harder than the other interactions | High | Medium | Start with fixed circuits and defined connection points; free wiring only if agreed later |
| R7 | Development environment without a persistent repository breaks the Git, test and commit rules | Medium | High | Decide D1 before Milestone 1 |
| R8 | LocalStorage data is lost or edited | High | Low for self-study, high for official marks | JSON export; state plainly that prototype scores are not official marks |
| R9 | Tablet and projector usability issues found late | Medium | Medium | Playwright runs at tablet size from Milestone 2; a projector check in Milestone 4 |
| R10 | Graph performance with long traces | Medium | Low | Fixed-length ring buffer; downsample before plotting; Canvas for dense waveforms |
| R11 | PDF output differs between browsers | Medium | Low | Print stylesheet tested in Chrome, Edge and Safari; a PDF library only if needed |
| R12 | Question banks are thin or poorly aligned to outcomes | Medium | Medium | Each question tagged to an outcome and level; you approve the bank for the reference module first |
| R13 | Student personal data exposed | Low in prototype | High | Nothing leaves the browser in the prototype; any backend needs institutional approval first |

## 9. Estimated implementation complexity

Milestones 5 and 8 are the largest pieces of work: the first for the number of converter topologies, the second for valve logic and circuit activities.

Sizes are relative, not durations: S is about one focused working session, M is two to three, L is four to six, XL is more than six. They assume course materials are available and each milestone is reviewed once.

| Milestone | Size | Engineering model | Interface | Main difficulty |
| --- | --- | --- | --- | --- |
| 1. Requirements, architecture, structure | S | None | None | Tooling configuration and conventions |
| 2. Dashboard, navigation, design system | M | None | Medium | Responsive seven-region layout that works on tablet and projector |
| 3. Simulation engine and graphing | M | Medium | Medium | Fixed-step loop, recorder and live graphs staying in step |
| 4. DC motor laboratory | L | High | High | Three motor types, starting transients, first full module, first report |
| 5. AC motor and power converters | XL | High | High | Rotating-field animation; seven converter topologies with waveforms |
| 6. Stepper and servo | L | Medium | Medium | Phase-sequence animation; controller tuning and response metrics |
| 7. Transmission and cam/follower | M | Low to medium | High | Mechanism animation; cam profile generation |
| 8. Pneumatic, electro-pneumatic, electrohydraulic | XL | Medium | Very high | Valve symbols and states, relay logic, connection and troubleshooting activities |
| 9. Assessment, progress, reports | L | Low | High | Ten question banks with explanations; print-quality reports |
| 10. Integration, documentation, deployment | M | None | Low | Cross-module regression; hosting decision |

The module with the highest technical uncertainty is Module 9, electro-pneumatics. The module with the highest content volume is Module 3, power converters.

## 10. Milestone 1 implementation plan

Milestone 1 produces an empty but fully configured project: it builds, lints, type-checks and runs tests, and its documentation records every decision. It contains no laboratory features.

### Objectives

- Convert this plan and your decisions into versioned project documents.
- Create the project skeleton with the folder structure in section 3.
- Put the quality tooling in place so every later milestone is tested from its first commit.

### Tasks

1. Inspect any existing project files you supply and record what is reused, before creating anything.
2. Initialise the Git repository with a `main` branch and a `milestone-1` working branch.
3. Scaffold Vite with React and TypeScript in strict mode; add Tailwind CSS.
4. Configure ESLint and Prettier, including the rule that blocks React and DOM imports inside `src/sim-core`.
5. Configure Vitest with coverage and Playwright with laptop and tablet viewports.
6. Create the folder structure with placeholder index files and the empty module registry listing all ten modules.
7. Define the core TypeScript interfaces: `SimModel`, module definition, measurement, question, report and repository.
8. Write `CLAUDE.md`: commands, conventions, layer rules, units policy, definition of done, current status.
9. Write `docs/srs.md`, `docs/architecture.md` and the template for simulation-model documents.
10. Write the first reference-case document (DC motor steady state) as the worked template for all later cases.
11. Add `.env.example` and `.gitignore`; confirm no secrets or personal data are in the repository.
12. Run the full check, record the results, commit and tag `milestone-1`.

### Automated tests in this milestone

- A smoke test that the application shell renders.
- A unit test of the units module: rad/s to rpm, bar to Pa, L/min to m³/s, each against a hand value.
- A registry test that exactly ten modules are registered with unique identifiers.
- A lint test that a deliberate UI import inside the simulation core fails the check.
- One Playwright test that the home page loads at laptop and tablet sizes.

### Deliverables

- Repository at tag `milestone-1`, with a clean build.
- `CLAUDE.md`, requirements and architecture documents, model-document template, first reference case.
- A verification note listing the commands run and their actual output.

### Exit criteria

- Install, type check, lint, unit tests, end-to-end test and production build all pass, with output shown to you.
- Every decision in section 11 is recorded with your answer.
- You approve the start of Milestone 2.

## 11. Missing information and decisions requiring approval

Twelve items need your answer. D1 and D2 affect whether Milestone 1 can start as planned; the rest can be confirmed with the recommendation and revisited.

### Missing information

| # | Item | Why it matters | Recommendation |
| --- | --- | --- | --- |
| D1 | Development environment | The rules require Git branches, commits, Vitest and Playwright, which need a repository that persists between sessions. A chat workspace is reset between tasks | Run development in Claude Code against a GitHub repository. The alternative is delivering each milestone from chat as a downloadable project archive, with you keeping the repository |
| D2 | BELK 3423 course materials | None have been provided. Outcomes, notation, lab procedures and question style cannot be aligned without them | Supply the course outline with CLOs, lecture notes, lab sheets and tutorials. Needed before Milestone 4; helpful from Milestone 1 |
| D3 | Existing work to reuse | The rules say to inspect the existing project first. If earlier simulator pages exist, such as a DC-drive simulator or a stepper and servo lab, they may hold layouts or models worth carrying over | Supply any existing files, or confirm this is a fresh start |
| D4 | Component data | Motor, cylinder and pump parameters can come from the actual UTeM lab equipment or from typical textbook values | Use the nameplate data of the physical lab equipment where you can supply it, so virtual and physical results can be compared |

### Decisions

| # | Decision | Recommendation |
| --- | --- | --- |
| D5 | Interface language: English only, or bilingual Malay and English | English first, with all text held in language files so Malay can be added without code changes |
| D6 | Branding: a "Design by Syahrul Hisham™" badge in the top header; use of the UTeM name and logo | Include the badge on every page header. Use the UTeM logo only once you confirm permission |
| D7 | PDF export method | Print stylesheet with the browser's Save as PDF. Add a PDF library only if browser differences cause problems |
| D8 | Three.js for 3D views | Defer. SVG and Canvas cover every listed requirement; revisit for the rotating magnetic field in Module 2 |
| D9 | Assessment and report timing | Build a thin version inside Milestone 4 and complete it in Milestone 9, so the format is tested on one module first |
| D10 | Student identification fields in reports | Name, matric number, programme, section, lecturer name, date. Confirm or amend |
| D11 | Purpose of assessment scores | Self-study and formative feedback only. Official marks need the Stage C backend and institutional approval |
| D12 | Hosting for the finished application | Decide by Milestone 10. A static host is enough for the prototype; a UTeM server may be preferred for student access |

**Approved on 14 November 2026:** all recommendations D1 to D12 accepted as written. Milestone 1 is cleared to start in Claude Code against a GitHub repository. Still to be supplied: course materials (D2), any existing files or confirmation of a fresh start (D3), and lab equipment nameplate data (D4).
