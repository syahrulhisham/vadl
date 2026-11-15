# Verification report — Milestone 9

Assessment centre, student progress and report generation for all ten laboratories. Branch
`milestone-9` (from `milestone-8`), run on 15 November 2026, Windows 11 (12 logical processors),
Node v24.21.0, npm 11.19.0. Plan: `docs/milestones/milestone-9.md`.

## 1. Gate

| Item                                         | Evidence                                                                                                                                                                                  | Result |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Error-carried-forward marking                | Unit tests: wrong first part → later parts accepted as "ecf"; a later slip still wrong; three chain questions accept their own answers for 200 seeds each                                 | Pass   |
| Lecturer-marked explanations                 | Saved with `marking: 'lecturer'`, never scored; marking guide shown; listed in the report with the student's text (unit and e2e)                                                          | Pass   |
| Circuit design checked by simulation (§5.11) | Five M09 tasks: reference solutions pass, an equivalent differently drawn circuit passes, a reset-dominant latch fails the set-dominant step only, direct control fails the indirect task | Pass   |
| Every question mapped to outcomes            | All ten banks: every outcome id exists in its laboratory and maps to LO1 or LO2; one explanation question per laboratory                                                                  | Pass   |
| Assessment centre                            | Ten banks listed; a set code reproduces the same set; an answer is saved to its laboratory (unit and e2e)                                                                                 | Pass   |
| Progress                                     | Totals across laboratories, by level and course LO, answers awaiting the lecturer; backup downloads a file; delete needs confirmation (unit and e2e)                                      | Pass   |
| Reports                                      | Status of each report; results by level and LO; lecturer answers; CSV of recorded rows in display units                                                                                   | Pass   |
| Data from storage only                       | All summaries are computed from stored attempts, rows and drafts; no value is created                                                                                                     | Pass   |
| All checks                                   | Section 4                                                                                                                                                                                 | Pass   |

## 2. What was built

| Area                 | Files                                                                                     | Notes                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Question kinds       | `src/features/assessment/types.ts`, `marking.ts`, `QuestionCard.tsx`                      | `chain` (multi-part, `markChain` with ECF) and `explanation` (lecturer-marked); `Attempt.marking`, `Attempt.partResults`                 |
| New questions        | `src/modules/*/questions.ts`                                                              | One explanation with a marking guide in each laboratory; chains: converter-fed DC drive (M01), VR stepper (M04), hydraulic lifting (M10) |
| Analytics            | `src/features/assessment/analytics.ts`                                                    | Bank statistics, seeded practice sets, scores by level and course LO, CSV helpers                                                        |
| Assessment centre    | `src/app/pages/AssessmentCentrePage.tsx`                                                  | Bank overview, practice sets with set codes, answers appended to each laboratory in order                                                |
| Progress             | `src/app/pages/ProgressPage.tsx`                                                          | All laboratories with totals, by level, by LO; CSV summary; backup, restore, delete with confirmation                                    |
| Reports              | `src/features/reports/*`, `src/app/pages/ReportsPage.tsx`                                 | Results by level and LO, lecturer answers, laboratory tasks, CSV of recorded rows; report status on the index                            |
| Design tasks         | `src/sim-core/logic/ladderTasks.ts`, `src/modules/m09-electro-pneumatics/DesignTasks.tsx` | OR, two-hand AND with a relay, latches (reset and set dominant), safety interlock                                                        |
| Shared stored values | `src/hooks/useStoredValue.ts`, `downloadText.ts`                                          | Instances with the same key share changes; files saved locally only                                                                      |
| Registry             | `src/modules/labs.ts`                                                                     | Each laboratory now carries its outcomes                                                                                                 |

## 3. Tests

| File                                                | Tests          | Covers                                                                                                                                                       |
| --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/unit/features/assessmentEngine.test.ts`      | 10             | ECF marking; bank statistics; practice-set reproducibility; scores by level and LO; report summary; CSV; completeness of all ten banks; chains for 200 seeds |
| `tests/unit/sim-core/ladderTasks.test.ts`           | 5              | Design tasks checked by simulation                                                                                                                           |
| `tests/unit/hooks/useStoredValue.test.tsx`          | +1             | Two instances of one key share changes                                                                                                                       |
| `tests/unit/app/assessmentProgressReports.test.tsx` | 9              | Centre, chain and explanation cards, progress totals and delete, report status and contents, M09 design task                                                 |
| Earlier bank and DC tests                           | updated        | New question kinds; reworded score line                                                                                                                      |
| `tests/e2e/assessment-progress.spec.ts`             | 2 × 2 projects | Practice set and explanation reach progress and report; backup and delete confirmation                                                                       |

Total: 556 unit and reference tests; 53 Playwright runs passed, 1 skipped by design.

## 4. Command output (actual, abridged where marked)

```text
=================== npm ci                         [exit code: 0]  8 moderate (lint-tool advisory, as before)
=================== npm run typecheck              [exit code: 0]
=================== npm run lint                   [exit code: 0]
=================== npm run format:check           [exit code: 0]  All matched files use Prettier code style!
=================== npm run build                  [exit code: 0]
dist/assets/AssessmentCentrePage-QvzzgV2s.js    5.57 kB │ gzip:   1.99 kB
dist/assets/ProgressPage-DIBHt0b9.js            7.10 kB │ gzip:   2.22 kB
dist/assets/ReportsPage-3wUO9BvL.js             1.94 kB │ gzip:   0.94 kB
dist/assets/index-Dmjn3Sr3.js                 144.21 kB │ gzip:  47.37 kB
✓ built in 9.17s

--- test runs with the previous setting of 6 unit-test workers ---
npm run test:coverage   run 1: 2 failed | 543 passed (159.5 s; "Failed to start forks worker … Timeout")
                        run 2: 11 failed | 529 passed (404.5 s; page-load and 30 s test timeouts)
npm run test:e2e        run 1: 1 failed (dc-lab tablet, timeout) | 52 passed (5.2 min)
                        run 2: 53 passed, 1 skipped (2.3 min)

--- after setting 4 unit-test workers (vitest.config.ts) ---
=================== npm run test:coverage
 Test Files  47 passed (47)
      Tests  556 passed (556)
   Duration  59.33s
 (simulation core, folders below 100 % only)
 sim-core/engine   |   97.71 |    91.12 |     100 |   98.96 |
 sim-core/logic    |   96.96 |    95.45 |     100 |   98.75 |
 sim-core/models   |   97.94 |    92.07 |   99.32 |   98.38 |
Statements   : 92.81% ( 4174/4497 )
Branches     : 86.08% ( 2425/2817 )
Functions    : 84.75% ( 1212/1430 )
Lines        : 92.99% ( 3795/4081 )
[exit code: 0]
=================== npm run test:e2e   (run 2 above, unchanged code)
  ok  [laptop] practice set answer and a lecturer-marked explanation reach progress and the report
  ok  [laptop] progress: backup downloads a file; delete needs confirmation
  ok  [tablet] (the same two tests)
  ok  (all earlier tests at both sizes)
  1 skipped
  53 passed (2.3m)
[exit code: 0]
```

Simulation-core gate (≥ 90 % of lines): met — engine 98.96 %, logic 98.75 %, models 98.38 %,
equations and units 100 %.

## 5. Issues found and resolved during the milestone

| Issue                                                                                                                                                                 | Resolution                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Two components holding the same stored list could overwrite each other** (assessment panel and design tasks)                                                        | `useStoredValue` instances with the same key share every change; unit test                                                                                 |
| **Unit tests timing out under load** (third milestone running): with six workers the coverage run failed 2 and then 11 tests, including reference tests, in 160–400 s | Four workers: 556/556 in about 60 s, also without coverage. A plain run with six workers passed in 65 s, so the margin was thin rather than the code wrong |
| Chain-question input labels duplicated the DC laboratory's control labels                                                                                             | Reworded ("Output of the field converter, Vf")                                                                                                             |
| A practice-set test could pass without checking the answer path                                                                                                       | Fixed set code; the test now requires the card                                                                                                             |
| Interface text first written in sim-core (task titles) and components                                                                                                 | Moved to content and language files (D5)                                                                                                                   |

## 6. Open items for the owner's review

- **L-14:** course Bloom/SP tags are not shown until the lecturer explains them; questions carry
  the laboratory outcome and course LO (provisional).
- **Scores are self-study only (D11).** Explanations and report text are for the lecturer to mark.
- **Test-suite speed:** the jsdom app tests render whole laboratory pages and take 15–37 s each;
  Milestone 10 can make them lighter (e.g. testing laboratories without the chart bundle).
- **Milestone 10** remains: integration testing (including other browsers, NFR-11), documentation
  and deployment; the classroom projector check.
