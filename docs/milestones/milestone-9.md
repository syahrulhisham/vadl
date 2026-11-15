# Milestone 9 — Assessment centre, student progress and report generation

Branch `milestone-9` (from `milestone-8`). Started 15 November 2026 after the owner approved
Milestone 8. Requirements: FR-10 to FR-13 (`docs/srs.md`), master instruction §7–§8 and
`docs/course-alignment.md` §5.11. The thin engines from Milestone 4 are completed for all ten
laboratories.

## Objectives

1. **Assessment engine (FR-10, FR-11, §5.11).**
   - Numeric chains with error-carried-forward marking: a later part is accepted when it is
     correct for the student's own earlier answers, and the feedback says so.
   - Short explanations marked by the lecturer: the answer is saved and listed in the report;
     a marking guide is shown for self-checking; never scored automatically.
   - Circuit design checked by simulation: design tasks in M09 run the student's ladder through
     test scenarios and report each scenario.
   - Every question mapped to its module outcome and the course learning outcome (LO1, LO2).
2. **Assessment centre.** Bank overview (questions by module, level and type); practice sets
   drawn from selected modules and levels with a reproducible set code; answers saved to each
   module, so progress and reports include them.
3. **Student progress (FR-12).** All ten modules: activities, recorded rows, automatically
   marked score, answers awaiting the lecturer, reports printed, last opened; totals by level and
   by course learning outcome; download a summary (CSV); back up, restore and delete all data
   in this browser, with confirmation.
4. **Reports (FR-13).** Assessment results by level and by course learning outcome, chain
   questions part by part, and lecturer-marked answers with the student's text; download the
   recorded data as CSV; the reports page shows each report's status.

## Stated limits

Self-study scores only (D11). Course Bloom/SP tags (L-14) are not shown until the lecturer
explains them. No data leaves the browser; backups are files the student keeps.

## Gate

Engine, centre, progress and reports work for all ten laboratories from stored data only; all
checks pass.
