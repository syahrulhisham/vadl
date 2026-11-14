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

| Concern       | Choice                                                  | Version (pinned)         |
| ------------- | ------------------------------------------------------- | ------------------------ |
| UI            | React, TypeScript strict                                | 18.3.1, 5.9.3            |
| Build         | Vite                                                    | 8.3.5                    |
| Styling       | Tailwind CSS with tokens in `tailwind.config.ts`        | 3.4.19                   |
| Unit tests    | Vitest + V8 coverage, Testing Library, jsdom            | 5.0.5                    |
| End-to-end    | Playwright (Chromium; laptop 1366×768, tablet 768×1024) | 1.64.1                   |
| Lint / format | ESLint (flat config) + typescript-eslint, Prettier      | 10.14.0 / 8.72.1, 3.9.10 |
| Routing       | React Router                                            | added in Milestone 2     |
| Graphs        | Recharts                                                | added in Milestone 3     |

## 8. Folder structure

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
└── e2e/                    Playwright
docs/
├── master-instruction.md, project-plan.md   owner's source documents
├── srs.md, architecture.md, decisions.md, course-alignment.md
├── simulation-models/      one document per model (template in _template.md)
├── reference-cases/        hand calculations behind each reference test
└── verification/           per-milestone verification reports
```
