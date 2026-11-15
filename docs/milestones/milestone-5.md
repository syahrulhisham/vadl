# Milestone 5 — AC motor drives and power converter laboratories

Branch `milestone-5` (from `milestone-4`). Started 15 November 2026 after the owner approved the
DC motor reference module. Scope follows `docs/course-alignment.md` §5.2 and §5.3.

## Objectives

1. **M02 AC Motor Drives.** Three-phase induction motor using the course's approximate
   equivalent circuit (magnetising branch at the terminals, per-phase voltage; "AC Drives new"
   p10–12) with rotor dynamics J·dω/dt = Td − TL − B·ω. Control methods taught in the course:
   direct on line, stator-voltage control (factor b), external rotor resistance, constant V/f,
   and frequency control at constant voltage (above base). Torque–speed curves with load line
   and operating point; slip, synchronous speed, rotor frequency, Tst, Tmax, smax; power flow
   and efficiency. A rotating-field view shows the rotor slipping behind the field.
2. **M03 Power Converters.** Centred on course Lab 1 (single-phase half-wave and bridge
   rectifiers, half-wave and full thyristor converters on a resistive load, 120/220/240 V,
   α = 0…180° in 30° steps), plus the inductive-load full converter, three-phase bridge, buck,
   boost and buck-boost choppers, and single- and three-phase inverters (square wave and
   sinusoidal PWM). Waveforms are computed from closed-form switching functions and run on the
   engine clock as an oscilloscope; averages, rms, ripple, fundamental and THD are computed by
   numerical integration over a period and checked in tests against the closed-form results.
3. **Shared laboratory parts.** Run controls, results recording, activities and progress are
   extracted from the DC laboratory into reusable components; the DC laboratory's tests guard
   the refactor.
4. Each laboratory gets content, an original question bank, a report definition and activities,
   registered in `src/modules/labs.ts`.

## Stated limits

- Induction motor: electrical transients, saturation and skin effect are not modelled;
  approximate equivalent circuit (as taught); balanced sinusoidal supply even on an inverter.
- Converters: ideal switches; no source inductance, overlap, dead time or switching losses;
  inductive-load converters assume ripple-free current; choppers in continuous conduction.

## Gate

Both laboratories run end to end and match the hand-worked reference cases; all checks pass.
