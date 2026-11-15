# Verification record — projector sizes and measurement grids

Dated 15 November 2026. Work done after the owner approved Milestone 10; the Milestone 10
record (`docs/verification/milestone-10.md`) is not changed by it. Run on Windows 11 (build
10.0.26300), Node v24.21.0, npm 11.19.0, Playwright Chromium.

## 1. Purpose

Make the measurement readouts of the ten laboratories readable and correctly laid out at
classroom projector and smaller desktop sizes, and check this automatically.

The work started from a failure of the new projector-size test: in the Servo laboratory at
1280 × 800, the Speed reading "-0.05101 rpm" ran past the edge of its meter. From 1280 px each
meter grid had four columns, which left each meter 115 px of content width; long readings with
their units need up to about 160 px. The same could happen at 1366 px.

## 2. Application change

- Exactly **13** measurement-grid class declarations changed, in the ten laboratory files
  (`src/modules/m01-dc-motor/DcMotorLab.tsx` to `m10-electrohydraulics/HydraulicsLab.tsx`; two
  grids in `ServoLab.tsx`, three in `TransmissionLab.tsx`, one in each of the others):

  ```text
  before: grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4
  after:  grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
  ```

- Meters now sit in two columns from 640 px, three from 1280 px and four from 1536 px. At the
  tested sizes: two at 1024 px, three at 1280 and 1366 px, four at 1920 px.
- Unchanged: the 24 px measurement values, padding, spacing and colours; `MeasurementDisplay`;
  the simulation engines, models and calculations. No other source line changed.
- The learning-resource page `src/app/pages/rl/RlCircuitPage.tsx` uses the same old class and was
  deliberately left unchanged: it is not one of the ten laboratories.

## 3. Automated coverage

`tests/e2e/projector.spec.ts`, run in the `laptop` Playwright project (it sets its own window
sizes):

| Viewport    | Expected grid columns |
| ----------- | --------------------: |
| 1024 × 768  |                     2 |
| 1280 × 800  |                     3 |
| 1366 × 768  |                     3 |
| 1920 × 1080 |                     4 |

The tests cover:

- all ten laboratory routes, at each of the four sizes;
- all 13 modified measurement grids; each laboratory's test counts the grids it measured (Servo 2,
  Transmission 3, the others 1) and fails on any other number;
- Servo in position mode, after a step run (the step-response metrics grid) and in speed mode;
- Transmission's gear-train, belt-tension and lifting-pulley views;
- representative long measurement values with each meter's own unit;
- the value and unit inside each meter's content area (its border box less border and padding)
  on all four sides, with a non-zero text extent;
- no horizontal scrolling;
- measurement values of at least 20 px (NFR-04);
- touch targets of at least 44 × 44 px (NFR-03);
- at 1280 × 800 and 1024 × 768 also navigation, header and run-control layout, Start and Stop,
  and the axe colour-contrast rule; the existing accessibility audit (`accessibility.spec.ts`)
  runs unchanged at 1366 × 768.

Views and modes that are not shown when a laboratory opens are reached through the laboratory's
own controls, as a student would: the "Belt tensions" and "Lifting pulleys" buttons, Start and
Stop for the step-response metrics, and Reset followed by the "Servo type" selector for speed
mode. Application state is not manipulated.

Before the class change was rebuilt, an earlier version of these grid tests was run against the
previous build: its 20 tests at 1280 and 1366 px failed and those at 1024 and 1920 px passed, as
expected. That earlier version did not yet have the per-label samples, the hidden-view coverage
or the Servo speed-mode coverage, which were added afterwards.

## 4. Engineering validity of the test values

- Test values are chosen per measurement label (`LONG_READINGS` in the test), never per unit,
  using the widest four-significant-figure forms that `formatSignificant` produces ("0.004344",
  "1.235e-4").
- A value is negative only where the laboratory's model gives the quantity a sign, for example
  the DC drive's four quadrants, induction-motor slip in generating and plugging, converter
  inversion, stepper and servo direction, cam return motion and piston retraction. Quantities
  whose sign could not be established from the code get non-negative values.
- Integer counts use integer samples (pulses, pulses per revolution, encoder count: "88888";
  phases: "5"; resolver quadrant: "4"). Inherently non-negative quantities (times, pressures,
  flows, RMS values, gear and pulley ratios, mechanical advantage, step angles, coil currents)
  are never given negative values; form factor and hydraulic area ratio, which are at least 1,
  use "1.111" and "12.34". Slip is signed (negative when generating), as the model gives it.
- The long values are written only into the rendered value text of each meter, measured, and
  the original text is put back. Simulation state and calculations are not changed.

## 5. Results

| Verification                                   | Result                 |
| ---------------------------------------------- | ---------------------- |
| Projector test (`tests/e2e/projector.spec.ts`) | 62 passed, 62 skipped  |
| Typecheck                                      | Passed                 |
| Lint                                           | Passed, zero warnings  |
| Format check                                   | Passed                 |
| Unit and coverage tests                        | 559/559 passed         |
| Line coverage                                  | 92.99 %                |
| Production build                               | Passed                 |
| Full end-to-end suite, run 1                   | 157 passed, 83 skipped |
| Full end-to-end suite, run 2                   | 157 passed, 83 skipped |
| `git diff --check`                             | Clean                  |

In both full runs all ten grid tests passed at each of the four sizes. The skipped tests are not
failures; all are skipped by design. Of the 83 skipped in each full run, 82 are in the configured
`tablet` project (the projector, grid and accessibility tests run only in the `laptop` project),
and 1 is the tablet-only menu test, skipped in the `laptop` project. The 62 skipped in the
projector test run are the `tablet` copies of the projector and grid tests.

## 6. Limitations and outstanding work

- These are automated viewport tests in Chromium, and they have passed. They are not a test on a
  physical projector.
- Testing on the actual classroom projector remains outstanding (`docs/guides/lecturer-guide.md`
  §1).
- The automated tests do not establish that any real projector, browser or classroom display has
  been physically verified.
- The RL-circuit learning-resource page was not included in the 13-grid correction and has not
  been checked for the same overflow.
- Servo presets (loaded position, PI, tracking) were not exercised separately; they use the
  position-mode measurement layout that is tested.
- VADL has not been deployed or released.

## 7. Git and release status

| Item                  | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| Branch                | `main`                                                            |
| HEAD                  | `ee81e3885f51723c3da75951034b0c57a25a5b07`, matches `origin/main` |
| `milestone-10` tag    | Unchanged, `2f81eb0ab7793828ae6a1beafa3a0346cd84d545`             |
| Changes recorded here | Not committed and not pushed when this record was written         |
| Deployment, release   | None                                                              |

## 8. Follow-up, 15 November 2026: overflow on Ubuntu and its correction

Sections 1 to 7 describe the state when this record was first written, before the work was
committed. They are kept as written; this section records what happened afterwards.

### 8.1 Initial failure

The work above was committed as `07beaa752f7e247b816495b217615d9e8b5820f4` and pushed to `main`.
Its CI run, **43711461484**, on GitHub's Ubuntu 26.04 runner, **failed**: 18 Playwright
measurement-grid tests failed because measurement units ran past the right edge of their meters'
content areas, by 1 to 30 px (for example "0.004344 pulses/s", "-0.004344 mm/s",
"-0.004344 rpm", "-0.004344 m/s"). Unit tests and all other end-to-end tests passed; the
Firefox, WebKit and sub-folder steps did not run. The results in section 5 were obtained on
Windows before this run and remain accurate for that machine; commit `07beaa7` itself did not
pass CI.

### 8.2 Root cause

Each reading's value and unit sat in a flex row that could not wrap. The interface font is
`system-ui`: Segoe UI on Windows, the system's sans-serif font on Ubuntu. Worked out from the CI
overflow amounts, the Ubuntu rendering of these readings was about 21 % wider than on Windows, so
the longest readings no longer fitted on one line. The values alone always fitted; only the units
spilled over.

### 8.3 Correction, commit `cc3ca44`

`cc3ca44c71254efedb49e0e30fddd5ad0d7a33f1`, "Fix measurement wrapping across platform fonts"
(parent `07beaa7`), changed two files:

- `src/design-system/MeasurementDisplay.tsx`: `flex-wrap` added to the reading row, so a unit
  that does not fit moves below its value. Values stay 24 px; colours, padding and spacing are
  unchanged.
- `tests/e2e/projector.spec.ts`: each long-reading check now runs in the page's own font and in
  a wide stress font (Verdana, else DejaVu Sans or the system sans-serif font; Verdana measured
  about 2-3 % wider than the Ubuntu rendering and is a stress font, not a copy of it). Added:
  separate containment of the value and of the unit in the content area, a value/unit no-overlap
  check, and a check that the unit wraps below the value whenever value, gap and unit are wider
  than the content area. The whole-row checks are kept.

Before the fix was built, the corrected tests failed against the old build (21 failures, all in
the wide-font pass, on the same meters as on Ubuntu), showing that they detect the problem.
With the fix, the local runs on Windows passed: projector tests 62 passed, full end-to-end
suite 157 passed twice, unit tests 559/559.

### 8.4 CI runs: before and after the correction

| Run         | Branch                   | Commit    | Laptop and tablet                 | Firefox and WebKit | Sub-folder build | Result |
| ----------- | ------------------------ | --------- | --------------------------------- | ------------------ | ---------------- | ------ |
| 43711461484 | `main`                   | `07beaa7` | 139 passed, 18 failed, 83 skipped | not run            | not run          | Failed |
| 43714396278 | `milestone-10-font-wrap` | `cc3ca44` | 157 passed, 83 skipped            | 22 passed          | 2 passed         | Passed |
| 43715273872 | `main`                   | `cc3ca44` | 157 passed, 83 skipped            | 22 passed          | 2 passed         | Passed |

`main` was fast-forwarded from `07beaa7` to `cc3ca44` (no merge commit) and pushed after the
branch run passed. Current `main`: `cc3ca44`.

### 8.5 Still outstanding

Verification on the physical classroom projector remains outstanding. These CI and local runs
are automated browser checks only. VADL has not been deployed or released.
