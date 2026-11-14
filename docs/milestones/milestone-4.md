# Milestone 4 — DC motor laboratory (reference module)

Branch `milestone-4` (from `milestone-3`). Started 15 November 2026 on the owner's instruction.
Scope follows the approved `docs/course-alignment.md` §5.1 and §5.11 and decision D9.

## Objectives

1. **Model.** A dynamic DC motor model for separately excited, shunt and series machines, in the
   course notation (Eg = Kv·If·ω, Td = Kv·If·Ia; series Eg = Kaf·Ia·ω, Td = Kaf·Ia²), that
   reduces exactly to the course's steady-state results. Includes starting resistance, viscous
   friction and the course's load-torque family T = C·Tr·(n/nr)^k.
2. **Supply.** A DC supply, or average-value controlled converters as taught: single-phase
   half-wave, semi, full and dual; three-phase half-wave, semi, full and dual; separate field and
   armature converters for separately excited motors. Single-quadrant converters cannot carry
   negative current; the model clamps armature current at zero and says so.
3. **Laboratory page.** The seven regions filled: theory and equations in course notation,
   an interactive diagram, parameter controls with presets, live measurements, time traces and a
   torque–speed characteristic with the load line and operating point, guided activities at three
   levels, and assessment.
4. **Thin assessment engine (D9).** Seeded question generation, multiple-choice and calculation
   items marked with tolerance, immediate feedback and explanations, attempts saved. Calculation
   keys are computed by the sim-core equation functions.
5. **Thin report generator (D9).** The ten report sections of master instruction §8 built from
   recorded rows, attempts and student-written text only; printed to PDF by the browser (D7).
6. **Thin progress.** Per-module counts of recorded sessions, activities completed, attempts and
   reports, from browser storage.

## Out of scope (stated limits)

- Magnetic saturation, armature reaction, brush drop, commutation.
- Discontinuous-conduction waveforms of converters (average-value model only).
- Four-quadrant DC-DC chopper classes (not in the course, alignment §5.1).

## Gate

The owner reviews the complete module before any other laboratory is started.
