# Architecture — VADL

Version 1.0 (Milestone 1). Expands `docs/project-plan.md` sections 2–4.

## 1. Layers

VADL is a client-only single-page application in four layers. Dependencies point downward only;
the simulation core depends on nothing.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Presentation   src/app, src/modules/*, src/design-system, src/i18n    │
│    shell, routes, module pages, diagrams, controls, text                 │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. Features       src/features/*                                         │
│    lab-shell, graphs, assessment, reports, progress, resources           │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. Services       src/hooks, src/storage                                 │
│    useSimulation, useRecorder, useProgress; Repository + LocalStorage    │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. Simulation core  src/sim-core   (no React, no DOM, no upper imports)  │
│    engine (clock, Euler, RK4, recorder) · units · equations · models ·   │
│    logic                                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

The interface never computes an engineering value. It sends parameters to a service, which runs
the core and returns measurements in SI; the presentation layer converts to display units through
`sim-core/units`.

**Enforcement.** `eslint.config.js` applies `no-restricted-imports` (React, React DOM, UI
libraries, and every upper-layer folder) and `no-restricted-globals` (`window`, `document`,
`localStorage`, …) to `src/sim-core/**`. `tests/unit/lint/sim-core-boundary.test.ts` lints probe
code at sim-core paths and fails if the rule ever stops firing.

## 2. Simulation core contracts (`src/sim-core/types.ts`)

| Contract                 | Use                                                             | Key members                                                                                                   |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SimModel<P, O, S>`      | Dynamic models (DC motor, induction-motor rotor, servo)         | `defaults`, `validate`, `init`, `derivatives`, `outputs`, `fastestTimeConstant`, `stateLabels`, `assumptions` |
| `StaticModel<P, O>`      | Algebraic steady state (transmission, converter averages, cams) | `validate`, `outputs(p)`                                                                                      |
| `LogicModel<P, I, S, O>` | Discrete events (valves, relay ladders, step sequences)         | `init`, `step(inputs, state, p)`, `outputs`                                                                   |
| `Issue`                  | Validation finding                                              | `parameter`, `severity`, `message` (engineering explanation)                                                  |
| `Measurement`            | One SI value at a time                                          | `key`, `value`, `time`                                                                                        |

The plan's sketch had `SimModel<P, S, O>` with an object state. The implemented contract uses a
numeric state vector `S extends readonly number[]` so generic Euler and RK4 integrators can
advance any model, and adds `fastestTimeConstant` to implement the step-size rule
(step ≤ τ_min / 10). `stateLabels` documents the meaning and unit of each vector element.

## 3. Module contracts (`src/modules/types.ts`, `src/modules/registry.ts`)

- `ModuleSummary`: id, number, slug, title key, milestone, status. All ten are registered in
  Milestone 1 with status `planned`.
- `ModuleDefinition` extends the summary with outcomes (each flagged `provisional`), model id,
  controls, measurements, graphs, activities, questions, and lazily loaded theory and workspace
  views (one bundle per laboratory).
- Adding a laboratory = adding one definition to the registry (NFR-09).

## 4. Feature contracts

| File                               | Contents                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/assessment/types.ts` | `LearningLevel`, `Question` (multiple-choice, troubleshooting, calculation with `generate(seed)`), `Attempt`                           |
| `src/features/reports/types.ts`    | `StudentIdentification` (D10), `RecordedRow`, `ExperimentSession`, `LabReport`, the ten `REPORT_SECTIONS`                              |
| `src/storage/types.ts`             | `Repository` (async get/set/remove/export/import/clear), `StorageKey`, `StoredRecord`, `Migration`, `SCHEMA_VERSION`, `STORAGE_PREFIX` |

"Recorded data only": `LabReport` refers to sessions and attempts; it has no field through which
the report generator could create a measurement.

## 5. Storage strategy

| Stored item         | Key                         | Contents                                                     |
| ------------------- | --------------------------- | ------------------------------------------------------------ |
| Student profile     | `vadl.v1.profile`           | D10 identification fields                                    |
| Progress            | `vadl.v1.progress`          | Per module: activities completed, level reached, last opened |
| Experiment sessions | `vadl.v1.sessions.<module>` | Parameters, recorded rows, timestamps                        |
| Assessment attempts | `vadl.v1.attempts.<module>` | Question id, seed, answer, mark, time                        |
| Reports             | `vadl.v1.reports.<id>`      | Discussion, conclusion, links to sessions and attempts       |
| Settings            | `vadl.v1.settings`          | Learning level, display units, simulation speed              |

Every record is wrapped in `StoredRecord` with a schema version; migrations run on load. Graph
traces are regenerated from saved parameters, not stored. Upgrade path: Stage A LocalStorage →
Stage B JSON export/import → Stage C authenticated backend (requires UTeM approval and PDPA 2010
compliance; outside the ten milestones unless added).

## 6. Design rules

- Fixed time step with an accumulator, independent of frame rate (Milestone 3).
- SI units inside; conversion to rpm, bar, L/min, mm and degrees only in `sim-core/units`.
- Lazy loading of each laboratory.
- SVG first for diagrams (prints cleanly into PDF); Canvas for dense waveforms; Three.js deferred
  (D8).

## 7. Technology

| Concern       | Choice                                                                    | Version (pinned)         |
| ------------- | ------------------------------------------------------------------------- | ------------------------ |
| UI            | React, TypeScript strict                                                  | 18.3.1, 5.9.3            |
| Build         | Vite                                                                      | 8.3.5                    |
| Styling       | Tailwind CSS with tokens in `tailwind.config.ts`                          | 3.4.19                   |
| Unit tests    | Vitest + V8 coverage, Testing Library, jsdom                              | 5.0.5                    |
| End-to-end    | Playwright (Chromium; laptop 1366×768, tablet 768×1024)                   | 1.64.1                   |
| Lint / format | ESLint (flat config) + typescript-eslint, Prettier                        | 10.14.0 / 8.72.1, 3.9.10 |
| Routing       | React Router (declarative mode, lazily loaded pages)                      | 7.18.5                   |
| Graphs        | Recharts (animations off), wrapped with a text description and data table | 3.10.1                   |

## 8. Application shell and design system (Milestone 2)

- **Routes** (`src/app/AppRoutes.tsx`): `/` welcome, `/overview`, `/modules`, `/modules/:slug`,
  `/resources`, `/activities`, `/assessment`, `/progress`, `/reports`, and a not-found page. Every
  page is a lazily loaded chunk. `AppRoutes` renders inside any router, so tests use
  `MemoryRouter` and the app uses `BrowserRouter`.
- **Layout** (`src/app/AppLayout.tsx`): skip link, header with the designer badge, primary
  navigation (sidebar at ≥ 1024 px, Menu button below), routed page, footer disclaimer.
- **Design system** (`src/design-system/`): `tokens.ts` is the single source of colour (Tailwind
  reads it; `TEXT_PAIRS` lists every text/background pair, each tested at ≥ 4.5:1). Components:
  `Button`/`LinkButton` (44 px targets), `Panel` (a named region), `PageHeader`, `StatusBadge`,
  `MeasurementDisplay` (24 px value, "—" when there is no value), `NumberControl` (slider plus
  number box; out-of-range input rejected with an explanation and never passed on), `Icon`
  (inline SVG, 24 px grid).
- **Laboratory layout** (`src/features/lab-shell/`): `LabShell` renders the seven regions in
  reading order (theory, workspace, controls, measurements, graphs, instructions, assessment) on
  a three-column grid at ≥ 1024 px, stacked below. Modules pass content per region; empty regions
  show which milestone fills them.
- **Storage** (`src/storage/localStorageRepository.ts`): implements `Repository` over any
  `StorageLike`; `resolveStorage` falls back to memory when browser storage is blocked.

## 9. Simulation engine and graphs (Milestone 3)

- **Integrators** (`sim-core/engine/integrators.ts`): `eulerStep`, `rk4Step`, `step`, `integrate`
  over any numeric state vector. Verified against analytic solutions and for order of accuracy.
- **Clock** (`clock.ts`): `advanceClock` turns real elapsed time × time scale into whole fixed
  steps with an accumulator; caps steps per frame and reports `lagging`.
- **Recorder** (`recorder.ts`): fixed-capacity ring buffer of `{ t, values }` samples;
  `downsample` keeps per-bucket minimum and maximum for plotting.
- **Runner** (`runner.ts`): `SimulationRunner` with `start`, `pause`, `stop`, `reset`, `tick`,
  `runFor`, validated `setParams`, `setMethod`, `setTimeScale`, `setEndTime`. Effective step
  Δt = min(maxDt, τ_min/10). Status: idle, running, paused, stopped, finished. A `version`
  counter changes whenever anything observable changes.
- **Hook** (`src/hooks/useSimulation.ts`): owns one runner, ticks it from animation frames
  (frames injectable for tests), credits at most 0.1 s per frame, re-renders on change.
- **Graphs** (`src/features/graphs`): `toTimeRows` (SI → display rows, downsampled to 600
  points), `TimeTraceChart` (live trace, optional dashed reference curves), `CharacteristicChart`
  (curve plus operating point), `ChartFigure` (caption, screen-reader description, data table).
- **Recording** (`src/features/recording`): `ResultsTable` shows `RecordedRow`s captured when the
  student presses Record; no value is computed there.
- **Proving model**: `engine.rl-circuit` (`sim-core/models/rlCircuit.ts`), shown at
  `/resources/rl-circuit` in the seven-region layout. Recharts is loaded only with pages that
  chart (about 116 kB gzipped).

## 10. Laboratory pattern (Milestone 4, the reference module)

- **Model contract addition:** optional `project(state, params)` applied by the runner after each
  step, for physical constraints (a single-quadrant converter holds the armature current at zero).
- **Module files** (`src/modules/m01-dc-motor/`): `content.en.ts` (outcomes, theory, activities,
  labels — a per-module language file, D5), `questions.ts` (bank; calculation keys computed by
  sim-core functions), `results.ts` (results-table columns), `report.ts` (report definition),
  `DcMotorDiagram.tsx`, `DcMotorLab.tsx` (the seven regions).
- **Registration** (`src/modules/labs.ts`): one entry per built laboratory — lazily loaded UI,
  report definition, questions, activity count. The module page renders the laboratory when an
  entry exists, otherwise the placeholder layout.
- **Storage** (`src/storage`): `RepositoryProvider` (browser storage, memory fallback),
  `useRepository`, stable keys in `keys.ts`, and `useStoredValue` in `src/hooks` (changes made
  before loading finishes are queued and replayed on the stored value).
- **Assessment** (`src/features/assessment`): `mulberry32` seeded generator, `markCalculation`
  (±2 %, unit and sign hints), `markChoice` (per-choice explanations), `QuestionCard`,
  `AssessmentPanel` (level filter, attempts saved).
- **Reports** (`src/features/reports`): `ReportView` renders the ten sections from stored rows,
  attempts, profile and the student's text only; `graphPoints` and `summariseAttempts` are pure.
  Print stylesheet via Tailwind `print:` variants; export through the browser print dialog (D7).
- **Progress** (`src/features/progress`): per-module activities completed, reports printed, last
  opened; the progress page adds rows recorded and answers from storage.
- **Rendering:** live simulation re-renders run as React transitions so they never starve a
  navigation or typing.

## 11. AC motor and power converter laboratories (Milestone 5)

- **Induction machine** (`src/sim-core/equations/inductionMachine.ts`): approximate per-phase
  equivalent circuit in course notation (per-phase Vs, Rs, Rr', Xs, Xr', Xm; mechanical ωs =
  4πf/p); slip, rotor current, input impedance, air-gap power, torque, Smax, Tmax, Tst.
- **Induction motor model** (`src/sim-core/models/inductionMotor.ts`): state [ω, θslip]; control
  methods DOL, stator voltage, rotor resistance, V/f and frequency above base; presets taken from
  the course examples; `project` wraps the slip angle used by the rotating-field view.
- **Waveforms** (`src/sim-core/equations/waveforms.ts`): closed-form instantaneous rectifier,
  DC-DC and inverter waveforms (seven rectifier circuits, buck/boost/buck-boost, square wave,
  bipolar/unipolar SPWM, six-step and three-phase SPWM); `waveStats` (midpoint rule, split at
  supplied breakpoints), `harmonicRms`, `thd`, `rectifierBreakpoints`.
- **Power converter model** (`src/sim-core/models/powerConverter.ts`): state [t] only; outputs
  are the instantaneous values plus period statistics (cached per parameter set), so the scope
  shows the true waveform at any playback rate. Playback is in periods per second.
- **Shared laboratory parts** (`src/features/lab-shell`): `useLabRecords`, `SelectField`,
  `RunControls`, `RecordPanel`, `ActivitiesList`, `TheoryBlock`, `OutcomesList`, constants and
  content types. The DC laboratory was refactored onto them; each module keeps only its
  diagram, controls and readouts.
- **Graphs:** `formatTick` gives four-significant-figure axis ticks; `timeUnitFor` adds µs.

## 12. Stepper and servo laboratories (Milestone 6)

- **Stepper** (`src/sim-core/equations/stepper.ts`, `models/stepperMotor.ts`): course step angle
  Sa = (Ns − Nr)/(Ns·Nr) × 360° with validation, phase sequences (wave, normal, half, micro) for
  VR and two-phase motors, sinusoidal torque–angle law. Pulses are discrete events: the state
  holds the pulse phase q, and `project` turns q ≥ 1 into a step (k ± 1). Ideal rotor by
  default; rotor dynamics as an option. `stepperSequenceTable` feeds both the lab table and
  the sequence questions.
- **Servo** (`equations/servo.ts`, `models/servoMotor.ts`): DC servo plant in a closed loop with
  Ve = Vcs − Vfc, amplifier limit, PI/PD extension with anti-windup; quadrature encoder and
  resolver functions; `responseMetrics` measures rise, overshoot and settling from a trace.
- **Residue display:** `cleanResidue` (units) turns integration residue below 1e−9 into 0 in
  model outputs, so a settled loop reads 0 V rather than 1e−14 V.
- **Assessment:** new question kind `sequence` (`SequenceQuestion`, `markSequence`,
  `SequenceTableInput`): a table of phase states and angles, cells marked exactly, angles to
  ±0.5° (course-alignment §5.11).
- **Timing diagram:** the stepper lab draws phase currents as a stepped digital timing diagram
  (SVG), the form used in the course notes.

## 13. Transmission and cam laboratories (Milestone 7)

- **Transmission** (`equations/transmission.ts`, `models/transmission.ts`): G = T_driven/T_driver
  (belts D_driven/D_driver) stated once (L-9); stages of gear (with idler), open or crossed belt
  and chain in a compound train; directions as signs; belt torque, speed and power; lifting
  pulleys; torque through the train as an extension. Kinematic state [θ0]: every shaft angle is
  θ0·ωk/ω0, so the drawing turns with the computed speeds.
- **Cam** (`equations/cam.ts`, `models/camFollower.ts`): rise, dwell, return, dwell with uniform
  velocity (course) and SHM, uniform acceleration, cycloidal (extensions); knife-edge, roller
  and flat-faced profiles in the cam frame, checked by geometric invariants; pressure angle and
  flat-face convexity warnings; displacement table at 30°, 45° or 22.5°.
- **Assessment:** new question kind `table` (`TableQuestion`, `markTable`,
  `NumericTableInput`): numeric rows each within max(absolute, relative) tolerance, used for
  cam displacement tables (course-alignment §5.11).

## 14. Fluid-power laboratories (Milestone 8)

- **Equations** (`equations/fluidPower.ts`): areas, course forces (10 % friction, spring),
  compressible and incompressible orifice flow, `pneumaticStroke`, `springStroke` and
  `hydraulicStroke` (VADL's quasi-static flow models), pump flow, relief characteristic (course
  measurement), powers, coil current and power.
- **Logic** (`src/sim-core/logic`): `ladder.ts` — relay-ladder evaluator (series/parallel
  contacts, NO/NC, relays settling within a scan, chatter detection, on-delay timer, fault
  injection) with Lab 3 presets; `pneumaticLogic.ts` — Lab 2 signal networks (shuttle OR,
  dual-pressure AND, double-pilot memory).
- **Models:** `pneumatics.ts` (M08), `electroPneumatics.ts` (M09, two cylinders under a ladder),
  `hydraulics.ts` (M10, Lab 4a lever and Lab 4b solenoid circuits); `pneumaticCylinder.ts`
  shares the cylinder and caches stroke speeds per parameter set. Discrete states (memory
  valve, relays, timer) live in the state vector and are updated in `project`.
- **UI parts** (`src/features/fluid-power`): `HoldButton` (momentary push button), `Lamp`,
  `CylinderView`, `LadderDiagram`, `SignalChain`; M09 adds an editable ladder (connection
  activity) and a hidden-fault troubleshooting exercise.
- **Units:** `mpaToPa`, `paToMpa`, `cm2ToM2`, `cm3ToM3` added. All ten laboratories are now built.

## 15. Assessment, progress and reports (Milestone 9)

- **Question kinds** (`src/features/assessment/types.ts`): multiple choice, troubleshooting,
  calculation, sequence table, numeric table, **chain** (multi-part, marked with error carried
  forward by `markChain`; each part has a `compute` from earlier values built on sim-core
  functions) and **explanation** (saved with `marking: 'lecturer'`, never scored by VADL).
- **Analytics** (`analytics.ts`, pure): `bankStats`, `buildPracticeSet` (seeded shuffle: a set
  code reproduces a set), `scoreSummary` (auto-marked only; by level and by course LO through
  each laboratory's outcomes), CSV helpers. `BuiltLab` now carries `outcomes`.
- **Pages:** `AssessmentCentrePage` (bank overview, practice sets; answers appended to each
  laboratory's attempts in order), `ProgressPage` (all laboratories, totals, by level and LO,
  CSV summary, backup/restore via `exportAll`/`importAll`, delete with confirmation via
  `clearAll`), `ReportsPage` (status of each report). `ReportView` adds results by level and
  LO, lecturer-marked answers and a CSV download of the recorded rows (`rowsToCsv`).
- **Design tasks checked by simulation** (`src/sim-core/logic/ladderTasks.ts`): a task is a
  sequence of button states and required coil states; `checkLadderTask` runs the student's
  ladder through it (and can require indirect control). Used in M09.
- **Shared stored values:** `useStoredValue` instances with the same key now share changes, so
  two components holding one list (assessment panel, design tasks) cannot overwrite each other.
- `downloadText` (in `src/hooks`) saves CSV and backup files locally; nothing is transmitted.

## 16. Integration, deployment and documentation (Milestone 10)

- **Integration pass** (`tests/e2e/integration.spec.ts`): every laboratory starts, runs,
  records a row and stops without page overflow, and its report shows the ten sections and the
  recorded row, with no console error; every dashboard area opens from a deep link.
- **Browsers (NFR-11):** Chromium at laptop and tablet sizes runs every test; the integration
  pass also runs in Edge, Firefox and WebKit (`npm run test:e2e:browsers`).
- **Accessibility (NFR-10):** axe-core audits twenty pages against WCAG 2.1 A and AA rules;
  serious and critical violations fail (`tests/e2e/accessibility.spec.ts`).
- **Base path:** `vite.config.ts` reads `VADL_BASE` at build time (build setting, not in the
  bundle); `BrowserRouter` takes its basename from `import.meta.env.BASE_URL` (`basenameFrom`).
  `playwright.base.config.ts` builds and tests a `/vadl/` sub-folder build.
- **Deep links on static hosts:** the build writes `404.html` (copy of `index.html`) and ships
  `_redirects`; server rules for Apache, IIS, nginx and Azure are in `docs/guides/deployment.md`.
- **Unit-test speed:** in jsdom, `ResponsiveContainer` from Recharts is replaced by a placeholder
  (`tests/setup.ts`); charts are tested in real browsers.
- **CI:** `.github/workflows/ci.yml` runs every check plus Firefox, WebKit and the sub-folder
  build on Ubuntu. It deploys nothing.
- **Guides:** `docs/guides/` (student, lecturer, maintainer, deployment).

## 17. Folder structure

```text
src/
├── main.tsx                entry point
├── index.css               Tailwind layers
├── app/                    shell, routes, layout, providers
├── design-system/          tokens, buttons, panels, meters, sliders, icons
├── i18n/                   language files (en.ts) and t()
├── sim-core/               NO React or DOM imports
│   ├── types.ts            SimModel, StaticModel, LogicModel, Issue, Measurement
│   ├── engine/             clock, integrators, recorder (M3)
│   ├── units/              SI conversions and formatting
│   ├── equations/          pure documented functions by domain (M4+)
│   ├── models/             model implementations (M4+)
│   └── logic/              valve and relay logic (M8)
├── modules/
│   ├── types.ts, registry.ts
│   └── m01-dc-motor/ … m10-electrohydraulics/
├── features/               lab-shell, graphs, assessment, reports, progress, resources
├── storage/                Repository interface; LocalStorage adapter (M2)
└── hooks/                  useSimulation, useRecorder, useProgress (M3)
tests/
├── setup.ts
├── unit/                   mirrors src
├── reference/              verification against docs/reference-cases (M4+)
├── e2e/                    Playwright
└── e2e-base/               sub-folder deployment check (M10)
docs/
├── master-instruction.md, project-plan.md   owner's source documents
├── srs.md, architecture.md, decisions.md, course-alignment.md
├── simulation-models/      one document per model (template in _template.md)
├── reference-cases/        hand calculations behind each reference test
├── milestones/             per-milestone plans
├── guides/                 student, lecturer, maintainer and deployment guides (M10)
└── verification/           per-milestone verification reports
```
