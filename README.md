# vadl
VADL Project Plan: Virtual Actuator and Drives Laboratory

## About VADL

VADL is a browser-based virtual laboratory for BELK 3423 Actuator and Drives at Universiti
Teknikal Malaysia Melaka (UTeM). It has ten laboratory modules:

1. DC motor drives
2. AC motor drives
3. Power converters
4. Stepper motors
5. Servo motors
6. Mechanical transmission
7. Cam and follower
8. Pneumatics
9. Electro-pneumatics
10. Electrohydraulics

Each laboratory has theory, a simulation with stated assumptions, recorded measurements,
graphs, guided activities, questions and a printable report.

VADL helps students prepare for and revise the physical laboratory sessions. It does not
replace them, and it is not a substitute for professional engineering tools. Scores in VADL
are for self-study only and are not official marks. Student work stays in the student's own
browser; nothing is sent to a server.

## Guides

- [Student guide](docs/guides/student-guide.md): using the laboratories, questions, reports
  and backups
- [Lecturer guide](docs/guides/lecturer-guide.md): setting work, set codes, marking and what
  students hand in
- [Maintainer guide](docs/guides/maintainer-guide.md): set-up, checks, project rules and adding
  a laboratory
- [Deployment guide](docs/guides/deployment.md): building VADL and serving it from a static web
  host

## Quick start

Requires Node.js 22.12 or later.

```bash
npm ci
npm run dev
```

Then open http://localhost:5173. `npm run check` runs every quality check; see the
[maintainer guide](docs/guides/maintainer-guide.md) for the full list.

## Project documents

- [Software requirements](docs/srs.md) and [architecture](docs/architecture.md)
- [Decision record](docs/decisions.md)
- [Course alignment](docs/course-alignment.md): course learning outcomes, notation and the
  questions for the lecturer
- [Simulation models](docs/simulation-models/) and their
  [hand-worked reference cases](docs/reference-cases/)
- [Verification reports](docs/verification/), one per milestone

Design by Syahrul Hisham™
