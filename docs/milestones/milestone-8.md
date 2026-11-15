# Milestone 8 — Pneumatics, electro-pneumatics and electrohydraulics laboratories

Branch `milestone-8` (from `milestone-7`). Started 15 November 2026 after the owner approved
Milestone 7. Scope follows `docs/course-alignment.md` §5.8–5.10.

## Objectives

1. **Shared fluid-power core.** Cylinder areas and forces with the course's 10 % friction;
   VADL's own quasi-static speed model (stated as such: the course has no pneumatic speed
   formula) using orifice flow through the valve passage and one-way flow controls, meter-out
   and meter-in; hydraulic pump, relief-valve opening characteristic (course measurement),
   non-return valve, back pressure, area/speed/time ratios, hydraulic and drive power
   (η = 0.7); coil current and power.
2. **M08 Pneumatics (Lab 2).** The five Lab 2 circuits as operable circuits: direct control,
   indirect control with a selector switch, OR (shuttle valve), AND with memory (dual-pressure
   and double-pilot 5/2 valve, roller-lever valve), and AND+OR (sliding door). Pressure
   regulator, flow-control settings, gauges, forces and speeds.
3. **M09 Electro-pneumatics (Lab 3).** A 24 V DC relay-ladder evaluator (series and parallel
   contacts, relays, solenoids, on-delay timer, sensors from cylinder positions), presets for
   Lab 3 Parts A–D plus latching and timer circuits, an editable ladder for connection
   activities, and fault injection for troubleshooting (broken wire, defective sensor or coil,
   welded contact, supply failure). Coil currents and contact loading.
4. **M10 Electrohydraulics (Labs 4a and 4b).** Hand-lever and solenoid circuits on the
   16/10/200 cylinder with the 9 kg load: lowering through a flow control, raising and holding,
   boiler door, sorting crates (meter-in), lifting platform with OR, AND and latch control.
   Pressures at the pump and both cylinder ports, flows, relief flow, speeds, stroke times,
   powers.
5. Content, original question banks, report definitions and activities for all three labs.

## Stated limits

Quasi-static flow models (no air compressibility dynamics, cushioning, stick-slip or oil
compressibility); ideal contacts and instant relays; pneumatic stroke 100 mm assumed (L-21).
Lab 4b Exercise 2 follows the UTeM sequence (buttons raise, switch lowers, otherwise hold)
pending L-24.

## Gate

All three laboratories run end to end and match `docs/reference-cases/fluid-power.md`; all
checks pass.
