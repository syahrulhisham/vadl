# VADL lecturer guide

How to use VADL with a BELK 3423 class. VADL is a preparation and revision aid for the
physical laboratory sessions, not a replacement for them, and its scores are for self-study only
(decision D11). It has no server and no accounts: each student's work stays in that student's
browser, and you receive it only when the student hands you a report or a file.

## 1. Before the class

- Open the site in the browser you will project and visit each laboratory you plan to use. The
  layout is designed for a laptop (1366 × 768) and a tablet in portrait; check the projector's
  resolution in the room before the first session.
- Read each laboratory's **assumptions and limitations** (in its theory region and in every
  report). They say which effects each model includes and which it leaves out.
- The course learning outcomes shown on screen are **provisional** until you confirm them
  (`docs/course-alignment.md`).

## 2. Setting work

| You want students to…                   | Do this                                                                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prepare for a physical session          | Name the laboratory and its beginner activities; ask for the report with recorded measurements                                                                                             |
| All attempt the same practice questions | In the assessment centre, choose laboratories, level and number, and give the class a **set code** (a number). The same code gives the same questions and the same numbers on every device |
| Revise a chapter                        | Name the laboratory and the level (beginner, intermediate, advanced)                                                                                                                       |
| Design a control circuit                | Electro-pneumatics laboratory, design tasks: VADL checks the ladder by simulation and saves the result                                                                                     |

## 3. What students hand in

1. **The laboratory report** (PDF). Students choose **Print or save as PDF** on the report page
   and pick "Save as PDF". It contains the ten report sections, including student
   identification (name, matric number, programme, section, lecturer, date), the recorded
   measurements, graphs from those measurements, their discussion and conclusion, and the
   assessment results.
2. **Recorded data (CSV)**, if you want to check the numbers in a spreadsheet.
3. **The backup file** `vadl-backup.json`, only if you want everything a student has done. It is
   a plain JSON file; it holds no password or personal data beyond what the student typed.

The report contains only what the student recorded. VADL cannot create a measurement for a
student, so an empty table in a report means nothing was recorded.

## 4. Marking

- **Automatically marked** answers (multiple choice, troubleshooting, sequence, table,
  calculation) are listed with their results, by level and by course learning outcome.
- **Multi-part calculations** use error carried forward. In the report, each part is marked
  correct, wrong, or "error carried forward" (correct for the student's own earlier answer).
- **Explanation answers** are listed in the report with the student's own text and are **not
  scored**. Each has a marking guide in the question bank that the student also sees after
  saving; mark them yourself.
- VADL scores are not official marks (D11). Use them as evidence of practice, not as grades.

## 5. Academic integrity

A student can repeat questions, reset a laboratory and edit a report before printing, and all
data is under the student's control in the browser. Treat VADL work as formative. For assessed
work, set a set code in class, ask for the explanation answers, or ask students to explain their
recorded results at the bench.

## 6. Limits to tell the class

- Results come from idealised models with stated assumptions; they will differ from the bench.
  Differences are a discussion point, not an error in either.
- Bench data from the UTeM laboratory (decision D4) has not yet been compared with the models.
- Work is lost if the browser's data is cleared, unless the student keeps a backup.

## 7. Reporting a problem

Send the maintainer the laboratory, the parameters, the browser and what you expected. A wrong
engineering value is treated as a defect: each model has hand-worked reference cases in
`docs/reference-cases/` that the value can be checked against.
