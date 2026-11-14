# Course alignment — BELK 3423 Actuator and Drives

**Status: course materials examined on 14 November 2026 (decision D2).** This document records
what the supplied BELK 3423 materials teach, how VADL maps to them, where the approved plan
differs from the course, and what the lecturer still needs to confirm.

## Confidentiality and sources

- The materials live in `course-materials/`, which is **git-ignored and never committed**. They
  include UTeM-internal lecture notes, answer schemes, examination papers and copyrighted Festo
  Didactic workbooks.
- This file paraphrases. It quotes no examination question and reproduces no answer scheme.
  Detailed findings on past examination papers and answer schemes are kept only in the
  git-ignored `course-materials/_vadl-analysis/` (reports A–D), not in this repository.
- References use the form _file, PDF page_. Folder abbreviations: **LN** lecture notes,
  **LS** lab sheets, **TU** tutorials, **EQ** equipment data (Festo).

## 1. Materials received

| Material                    | Received | Examined | Notes                                                                                                                                                                                                                                   |
| --------------------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teaching plan, 2026/2027    | Yes      | Yes      | Learning outcomes, synopsis, weekly plan, assessment weights. File name says BEEI3423; content says BELK 3423                                                                                                                           |
| Lecture notes (14 decks)    | Yes      | Yes      | Chapters 1–6. Equations are mostly images; read from rendered pages. LN Ch1 Part II pages 4 and 8 render blank                                                                                                                          |
| Lab sheets (6)              | Yes      | Yes      | Lab 1 converters; Lab 2 pneumatics (V3 and V4; V4 current); Lab 3 electro-pneumatics; Lab 4a hydraulics; Lab 4b electrohydraulics                                                                                                       |
| Tutorials and answers (~60) | Yes      | Yes      | Tutorials 1–6 in several course-code versions (BEEI, BETI, BELK, BEKE); handwritten answer scans read as images. Third-party textbook solution manuals noted but not used                                                               |
| Past examinations (3 sets)  | Yes      | Yes      | 2023/24, 2024/25, 2025/26 papers and schemes. Used only for topic emphasis and assessment style; see the confidentiality note                                                                                                           |
| Multiple-choice bank        | Yes      | Yes      | 30 recall-level MCQs and 15 stepper short-answer items, all keys verified correct                                                                                                                                                       |
| Equipment data              | Yes      | Yes      | 12 Festo Didactic workbooks/worksheets: TP101/102 pneumatics, TP201/202 electro-pneumatics, TP501 hydraulics, TP601 electrohydraulics. These describe the training sets, not nameplates of the actual UTeM benches (D4 partly answered) |

Not supplied: Chapter 6 Part II (hydrostatics, hydrodynamics, accumulators, actuators) and the
"Hydraulic vs Pneumatic" lectures listed for weeks 13–14 of the teaching plan.

## 2. Learning outcomes

| LO  | Outcome (paraphrased)                                                                                                     | PO  | Domain | Assessed by                                | VADL role                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --- | ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| LO1 | Analyse the design of electrical and mechanical actuators and drives in motor-drive, pneumatic and hydraulic applications | PO1 | C4     | Mid-term test 10 %, final examination 40 % | Theory, worked calculations, problem-solving exercises and assessment items in all modules |
| LO2 | Conduct experiments on DC and AC drives, pneumatic/hydraulic and electro-pneumatic/hydraulic systems                      | PO4 | P4     | Lab assessments (5) 25 %, lab test 15 %    | Virtual versions of the five course labs; recorded results and lab reports                 |
| LO3 | Present a group assignment on actuators and drives                                                                        | PO9 | A2     | Assignment 10 %                            | Not assessed by VADL; VADL may be used as a source for the assignment                      |

VADL questions will carry the course's own tag format `[Cx, SPy]` (Bloom level and problem
attribute) plus the LO. The meaning of "CP2" and the SP codes is to be confirmed (§8, L-14).
Until then VADL learning outcomes stay marked `provisional` in the module data.

## 3. Course topics mapped to VADL modules

Teaching-plan weeks are given as W1–W14.

| VADL module                 | Course chapter and week                                                                         | Course lab                                          | Examination emphasis (all three sessions)                        | Alignment       |
| --------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| M01 DC motor drives         | Ch1 Parts I–III: fundamentals, four quadrants, single- and three-phase converter drives (W1–W3) | Lab 1 (see note 1)                                  | High: single-phase converter-fed DC drive calculation every year | Re-scope (§5.1) |
| M02 AC motor drives         | Ch1 Part IV and "AC Drives new" (W4)                                                            | —                                                   | Medium: induction-motor rotor-resistance speed control           | Re-scope (§5.2) |
| M03 Power converters        | Ch1 Part I (rectifiers, choppers, inverters) and converter drives                               | **Lab 1** single-phase AC–DC converters             | Converter formulas used inside DC-drive questions                | Re-scope (§5.3) |
| M04 Stepper motors          | Ch2 Part I (W5)                                                                                 | Lab preliminary tables in the lecture deck          | High: about 20 % of each paper                                   | Adjust (§5.4)   |
| M05 Servo motors            | Ch2 Part II (W6)                                                                                | —                                                   | Low: block diagram, servo vs stepper                             | Adjust (§5.5)   |
| M06 Mechanical transmission | Ch3 Parts I–II: belts, gears, pulleys (W7)                                                      | —                                                   | Gear/belt train and pulley block in Part B every year            | Extend (§5.6)   |
| M07 Cam and follower        | Ch3 Part I (W7)                                                                                 | —                                                   | Displacement diagram construction every year                     | Adjust (§5.7)   |
| M08 Pneumatics              | Ch4 Parts I–II (W8–W10)                                                                         | **Lab 2** pneumatics                                | Circuit design (Part B option)                                   | Extend (§5.8)   |
| M09 Electro-pneumatics      | Ch5 (W11)                                                                                       | **Lab 3** electro-pneumatics                        | Relay-latch circuit design and explanation every year            | Aligned (§5.9)  |
| M10 Electrohydraulics       | Ch6 Part I (W12–W14)                                                                            | **Lab 4a** hydraulics, **Lab 4b** electrohydraulics | Electrohydraulic design (some sessions)                          | Extend (§5.10)  |

Notes:

1. The teaching plan calls Lab 1 "DC Motor Drives", but the lab sheet is single-phase AC–DC
   converters with a resistive load only, no motor. VADL places Lab 1 in M03 and links it to M01.
2. The teaching plan has five labs (Lab 4 hydraulic, Lab 5 electrohydraulic); the files are
   named Lab 4a and 4b.
3. Topics in the synopsis but never examined numerically in the three papers: DC-DC (chopper)
   drives, three-phase converter calculations, V/f control, load characteristics and motor
   sizing, pure hydraulics. VADL still teaches them, because the lectures cover them.

## 4. Notation adopted from the course

VADL will display the course's symbols. Internally the core keeps SI names; the mapping lives in
each model document.

| Quantity                   | Course notation                                                            | Source                            | VADL plan had            |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------- | ------------------------ |
| Back-emf                   | **Eg** (also Vg in Tutorial 1)                                             | LN Ch1 Part II p15; Tutorial 2    | Eb                       |
| Machine constant           | **Kv·If** in V/(A·rad/s) for separately excited; **kΦ** for constant field | LN Ch1 Part II p15; Tutorial 1    | Ke, Kt                   |
| DC motor equations         | Eg = Va − Ia·Ra; Eg = Kv·ω·If; Td = Kv·If·Ia; ω = 2πN/60                   | LN Ch1 Part II p15                | Same physics             |
| Supply peak                | **Vm = √2·Vrms** (single-phase); peak **phase** voltage (three-phase)      | LN Ch1 Parts II–III               | Vrms, VLL                |
| Firing angles              | **αa** (armature), **αf** (field), degrees                                 | LN Ch1 Part II                    | α                        |
| Induction motor slip       | S = (ωs − ωm)/ωs = (Ns − Nm)/Ns; ωs = 2ω/p (mechanical)                    | "AC Drives new" p3–4              | Same                     |
| Stepper step angle         | **Sa = (Ns − Nr)/(Ns·Nr) × 360°** (Ns, Nr = stator/rotor teeth)            | LN Ch2 Part I p8                  | 360°/steps per rev       |
| Stepper speed              | **N = Sa·PR·60/360 = Sa·PR/6 = PR·60/PPR** (rpm, PR in pulses/s)           | LN Ch2 Part I p14–15              | Same physics             |
| Servo error                | Drive signal = Vcs − Vfc                                                   | LN Ch2 Part II p10                | e = reference − feedback |
| Gear ratio                 | G = T_driven / T_driver (> 1 is a reduction); direction CW/CCW             | LN Ch3 Part II p23–27; Tutorial 4 | Same; add direction      |
| Pulley block               | MA = load/effort; VR = effort distance/load distance; η = MA/VR            | LN Ch3 Part II p46–56             | Not in plan              |
| Fluid-power component tags | Festo/ISO 1219 style: 1A1, 1V1, 1S1, 1B1, 1M1, K1, 0Z1                     | Lab sheets; Festo workbooks       | Not specified            |
| Hydraulic pressure units   | **MPa** (relief 5 MPa), cm², L/min; pneumatics in bar                      | Lab 4a/4b; Festo TP501            | bar                      |

Four-quadrant diagrams: the lecture uses two layouts (LN Ch1 Part I p55 vs p60). VADL will use
speed on the vertical axis and torque on the horizontal axis, numbered counter-clockwise (p60),
pending confirmation (L-7).

## 5. Required changes to the VADL plan

The approved plan (`docs/project-plan.md`, section 5) was written before the course materials
were examined. The items below bring it into line with the course. **All items in this section
were approved by the project owner on 14 November 2026.** Where they differ from
`docs/project-plan.md`, this section takes precedence; the plan document itself is the owner's
and is not edited.
Where the plan goes beyond the syllabus, the extra content stays but is labelled
"beyond the BELK 3423 syllabus" on screen.

### 5.1 M01 DC motor drives

- Add converter-fed drives as taught: single-phase half-wave, semi, full and dual converters,
  and three-phase half-wave, semi, full and dual converters, each with **separate field and
  armature converters**.
  - Half-wave: Va = (Vm/2π)(1 + cos αa)
  - Semi: (Vm/π)(1 + cos α)
  - Full: (2Vm/π)cos α
  - Three-phase full: (3√3·Vm/π)cos α
  - Dual converter: the second converter needs a sign the slides omit (L-6)
- Add field control, base speed, constant-torque and constant-power regions, and four-quadrant
  operation.
- Course analysis is **steady state only**. The dynamic model required by the master instruction
  (La·dIa/dt, J·dω/dt = Te − TL − Bω) stays. It must reduce exactly to the course's steady-state
  results and is labelled beyond the syllabus. The examination formula sheet does include
  Td = J·dω/dt + Bω + TL.
- Add the load-torque family T = C·Tr·(n/nr)^k, k = 0, 1, 2, −1 (LN Ch1 Part I p11–12).
- Always state the converter type for both field and armature, and never combine
  "maximum field current" with a non-zero αf. Past questions are ambiguous on both points.

### 5.2 M02 AC motor drives

- Use the course's **approximate equivalent circuit**, with the magnetising branch moved to the
  supply terminals, and per-phase Vs ("AC Drives new" p10–12). This replaces the plan's Thevenin
  form; Thevenin can be an optional comparison. The course answers are not reproduced by the
  Thevenin form.
- Add stator-voltage control (factor b), rotor-resistance control, slip-power control with
  Re = R(1 − k), above-base-frequency control (ωs = βωb, Tm ∝ 1/β²) and constant V/f (Tutorial).
- Validate that the target speed is below Ns and that Ns agrees with f and poles.

### 5.3 M03 Power converters

- Centre the module on **Lab 1**: half-wave and bridge diode rectifiers, single-phase half-wave
  and full thyristor converters at 120, 220 and 240 V, firing angles 0–180° in 30° steps.
- Provide **both** load cases for the full converter, selected explicitly:
  - resistive load (discontinuous current): (Vm/π)(1 + cos α), as used in the lab;
  - highly inductive load (continuous current): (2Vm/π)cos α, as in the lecture.
- Choppers: buck, boost and **buck-boost** (missing from the plan), with inductor ripple,
  minimum inductance and capacitor ripple (LN Ch1 Part I p35–46).
- Rectifier performance: average and rms values, efficiency. The lecture's power-factor example
  contains an error (L-1).
- Inverters: half and full bridge, qualitative, plus PWM waveforms. Switching-loss models remain
  out of scope.

### 5.4 M04 Stepper motors

- Use the course formula Sa = (Ns − Nr)/(Ns·Nr) × 360° for variable-reluctance motors, and
  validate the input: Ns ≠ Nr, a positive result, and an integer number of steps per revolution
  (past items produced non-integer values). Show the phase-based and hybrid formulas only as
  extensions.
- Default motor: the course's **3-phase 6/4 variable-reluctance motor**, 30° full step and 15°
  half step, with one-phase-on, two-phase-on and half-step tables (LN Ch2 Part I p40–43).
- Drive modes as taught: wave and normal (full step), half step; unipolar and bipolar waveforms.
  Microstepping appears only as a driver resolution table, so it is shown as an extension.
- Outputs: Sa, pulses per revolution (PPR = 360/Sa), pulse rate, time per step (1/PR), speed,
  pulses for a given angle.
- Assessment: pulse-sequence table construction (examined every year).

### 5.5 M05 Servo motors

- The course is qualitative: servo amplifier, motor, sensor; DC servo (armature-controlled) and
  AC two-phase servo; servo vs stepper; resolver; **quadrature encoder** (4 counts per line,
  index Z, direction from A/B lead). Add the resolver and encoder, which the plan lacks.
- PID control, transfer functions and time-domain specifications (rise time, overshoot,
  settling time) are **not in the course material**. Keep them as an advanced extension
  (L-16).

### 5.6 M06 Mechanical transmission

- Add **lifting-pulley systems**: MA, VR, efficiency, effort and distances. These are examined
  every year and are missing from the plan.
- Add direction of rotation for gears (external mesh reverses; an idler does not change the
  ratio), open belts (same direction) and crossed belts (reversed), and chain drives (same
  direction).
- Belt torque and power from tight and slack tensions: T = (T1 − T2)·r, P = (T1 − T2)·v.
- Compound gear and belt-pulley trains, including mixed trains.
- Torque multiplication T_out = η·G·T_in, belt length, slip and e^(μθ) are beyond the syllabus.
- Define G once and show it consistently: some slides print the tooth fraction inverted (L-9).

### 5.7 M07 Cam and follower

- The course teaches **uniform velocity** only, with rise, dwell and return, and displacement
  diagrams drawn at 30° (also 45° and 22.5°) increments. It covers knife-edge, roller and flat
  followers on plate cams, plus drum cams. **Add the knife-edge follower.**
- Simple harmonic, cycloidal and uniform-acceleration motion, pressure angle and offset followers
  remain as extensions.
- Assessment: construct the displacement diagram and the cam profile on a polar grid.

### 5.8 M08 Pneumatics

- Use the lab hardware as defaults: Festo TP101 double-acting cylinder **20 mm bore, 8 mm rod**;
  single-acting cylinder 20 mm with a 13.6 N return spring. Working pressure is up to 6 bar,
  5 bar recommended, and 3.5 bar or 3 bar in specific exercises. The stroke must be confirmed
  (L-21).
- Friction as in the course: **10 % of theoretical force**, so F_eff = 0.9·p·A − F_spring.
  Frictionless values remain available as the ideal case.
- Add pure pneumatic logic, which is the whole of Lab 2:
  - shuttle valve (OR);
  - dual-pressure valve (AND);
  - pilot-operated 3/2 and 5/2 valves, with the double-pilot 5/2 valve as memory;
  - roller-lever valves, selector switches, pneumatic proximity switches.
- Flow control: exhaust-air (meter-out) throttling is the default for double-acting cylinders,
  with supply-air throttling for comparison. The course has **no pneumatic speed formula**, so
  VADL's speed model is its own and must be stated as such.
- Air consumption and gauge vs absolute pressure are listed in the lecture contents but not
  taught (L-17).

### 5.9 M09 Electro-pneumatics

- Matches the plan: 24 V DC relay-ladder evaluator; direct and indirect control; OR and AND;
  latching (dominant set or reset); double-solenoid memory; limit and reed switches; timer
  (on-delay); one-shot and continuous stroke.
- Lab 3 parts A–D become the fixed circuits. Part D is the two-cylinder sequence 1A1+ 2A1+
  1A1− 2A1−, triggered by sensors and a push button. Students draw the ladder diagram in Part D.
- Fault-injection catalogue from Festo TP201/TP601: broken supply, earth or signal wire;
  defective or misadjusted sensor; defective coil or relay.
- Electrical context: coil current and power, contact ratings (push button 2 A, relay 5 A),
  and the reasons for indirect control.
- Diagram convention: IEC current-path diagrams by default; JIC is also shown in the lecture
  (L-23).

### 5.10 M10 Electrohydraulics, including pure hydraulics

- The module must cover **both** Lab 4a (hydraulic, hand-lever valves) and Lab 4b
  (electrohydraulic).
- Lab hardware defaults (Festo TP501/TP601):
  - gear pump 1.6 cm³/rev, about 2.2 L/min (labs use 2 L/min);
  - cylinder **16/10/200 mm** (A_P ≈ 2.0 cm², A_PR ≈ 1.2 cm²);
  - 9 kg load (90 N);
  - relief valve set to **5 MPa**, system limit 6 MPa;
  - non-return valve cracking at 0.6 MPa.
- Add from the course:
  - drive power P = p·q/η with η = 0.7;
  - back pressure, F = A_P·p1 − A_PR·p2;
  - area, speed and time ratios;
  - load pressure from a hanging weight;
  - the relief-valve opening characteristic (opens about 0.4 MPa below setting);
  - 4/3 valve centre positions;
  - pilot check and counterbalance valves;
  - meter-in and meter-out, including pressure intensification;
  - slide-valve leakage drift.
- 100 bar in the plan's reference case exceeds the lab's 6 MPa limit; keep it only as a
  textbook case.

### 5.11 Assessment engine

- Question types needed:
  - numeric chains with error-carried-forward marking;
  - multiple choice;
  - short explanation, marked by the lecturer;
  - stepper pulse-sequence tables;
  - cam displacement diagrams;
  - gear and belt trains with speed **and** direction;
  - (electro)pneumatic/hydraulic circuit design, checked **by simulation** rather than by matching
    a drawing (15 of each 25 Part B marks).
- Tolerances: ±2 % on derived values, ±0.5° on firing angles; exact integers for pulse and step
  counts.
- Parameter generators must enforce physical validity. Past papers contain cases that violate it:
  speed above synchronous speed, non-integer steps per revolution, inconsistent pole and
  frequency data.
- Language: English primary (D5). An optional Malay glossary of key terms can be added later
  (L-25).

## 6. Reference cases from the course

Cases from lecture notes, tutorials and Festo workbooks, recomputed independently and found
correct unless stated. Each becomes a `docs/reference-cases/` document and a test in the
milestone that builds its module. Examination-derived cases are kept privately and are not
listed here.

| ID        | Module | Source                             | Case                                                                                  | Expected                                                             |
| --------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| RC-M01-01 | M01    | Project plan (existing)            | Separately excited motor steady state                                                 | Ia 20 A, Eg 210 V, ω 175 rad/s, η 95.45 %                            |
| RC-M01-02 | M01    | Tutorial 2 Q2 (Rashid Ex. 15.1)    | 1-φ full converters, 440 V 60 Hz, Ra 0.25 Ω, Rf 175 Ω, Kv 1.4, αf 0°, αa 60°, Ia 45 A | Vf 396.14 V, If 2.264 A, Td 142.6 N·m, Va 198.07 V, ω 58.95 rad/s    |
| RC-M01-03 | M01    | Tutorial 1 Q6–Q9                   | Series motor torque/current; constant-torque and field-weakening regions              | e.g. 21.74 A, 79.58 N·m; 94.25 A; 150 N·m                            |
| RC-M02-01 | M02    | Tutorial (AC) Q4                   | Constant V/f, 460 V 60 Hz 4-pole, Rs 0; 60 Hz and 30 Hz                               | Tm 196.94 N·m at both; ωm 163.36 and 69.11 rad/s                     |
| RC-M02-02 | M02    | Tutorial (AC) Q1–Q2                | Approximate-circuit performance; stator-voltage control                               | Td ≈ 118.6 N·m, η ≈ 92 %; Va ≈ 137.9 V (≈1 % tolerance)              |
| RC-M02-03 | M02    | "AC Drives new" p31–35             | Slip-power chopper, part (a)                                                          | R = 2.3856 Ω                                                         |
| RC-M03-01 | M03    | Lab 1 (computed)                   | 240 V, R load, α = 0…180° in 30° steps                                                | Half-wave 108.0 → 0 V; full bridge 216.1 → 0 V                       |
| RC-M03-02 | M03    | Project plan (existing)            | Buck 48 V, D 0.4; boost 12 V, D 0.6                                                   | 19.2 V, ripple 0.576 A; 30 V                                         |
| RC-M04-01 | M04    | Tutorial 3, LN Ch2 Part I          | VR 12/8; 6/4 at 100 rpm; Sa 15° at 300 pps                                            | 15°; 30°, 12 PPR, 20 pps, 0.05 s; 750 rpm                            |
| RC-M04-02 | M04    | MCQ bank stepper set               | 1.8° at 500 pps, then half step                                                       | 150 rpm, then 75 rpm                                                 |
| RC-M05-01 | M05    | LN Ch2 Part II p25                 | Encoder, 2¾ lines                                                                     | 11 quadrature counts                                                 |
| RC-M06-01 | M06    | Tutorial 4 Q4                      | A 16T at 600 rpm CW, idler 28T, C 84T                                                 | B 342.9 rpm, C 114.3 rpm CW, ratio 5.25                              |
| RC-M06-02 | M06    | LN Ch3 Part II p26–27              | Compound train 120T/40T, 80T/20T, 30 rpm CW                                           | 360 rpm CW, G = 1/12                                                 |
| RC-M06-03 | M06    | LN Ch3 Part II p53–56              | Pulley blocks                                                                         | MA = VR = 4 (25 N for 100 N); MA = 6 for 150 N with 25 N             |
| RC-M07-01 | M07    | LN Ch3 Part I p27–29               | Uniform velocity, 30 mm rise over 180°                                                | 0.1667 mm/°; 5 mm per 30°                                            |
| RC-M08-01 | M08    | Festo TP101 p49                    | Double-acting 20/8 mm, 6 bar, 10 % friction                                           | Extend 169.6 N, retract 142.5 N (ideal 188.5 N / 158.3 N)            |
| RC-M08-02 | M08    | Festo TP101 p28                    | Single-acting 20 mm, 6 bar, 10 % friction, spring 13.6 N                              | 156.0 N                                                              |
| RC-M08-03 | M08    | Project plan (existing)            | 50/20 mm, 6 bar, frictionless                                                         | 1178 N / 990 N (1060 N / 891 N with 10 % friction)                   |
| RC-M10-01 | M10    | Lab 4a Ex 2–3 / Festo TP501 p79–90 | 16/10 cylinder, q 2 L/min, s 200 mm, 90 N load                                        | Load pressure 0.75 MPa; v 0.167 / 0.278 m/s; t 1.2 / 0.72 s; φ 1.667 |
| RC-M10-02 | M10    | Festo TP501 p93–94                 | Back pressure: D 50, d 25 mm, p1 50 bar, p2 6 bar; fill time at 5 L/min, s 250 mm     | F 8.93 kN; t 5.89 s                                                  |
| RC-M10-03 | M10    | Festo TP501 p160                   | Drive power, q 2 L/min, η 0.7, at 5 MPa and 0.3 MPa                                   | 238.1 W; 14.3 W                                                      |
| RC-M10-04 | M10    | Project plan (existing)            | 63 mm bore, 10 L/min, 100 bar (textbook case, above lab limit)                        | 53.47 mm/s, 31.17 kN, 1.667 kW                                       |

## 7. Errors found in the course materials

These are recorded so that VADL does not reproduce them. Each is listed for the lecturer in §8.
Examination-paper and answer-scheme errors are recorded only in the private reports.

| Source                                   | Issue                                                                                                      | Correct value or action                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| LN Ch1 Part I p27–28 (Exercise 1)        | Power factor given as 8                                                                                    | 0.809                                           |
| Tutorial 2 (DC) answer, Q1(ii)–(iv)      | Vm halved, Kv 15 instead of 1.5, If off by ×10; (iv) unanswered                                            | ω = 71.67 rad/s for (ii); (iii) needs restating |
| "AC Drives new" p22–23; Tutorial (AC) Q3 | Rated torque used as breakdown torque; electrical 377 rad/s treated as mechanical                          | β 2.372, f ≈ 142.3 Hz, Nm ≈ 4030 rpm            |
| "AC Drives new" p21                      | Spurious S in the base breakdown-torque expression                                                         | Remove S                                        |
| Tutorial 6 (AC)                          | 4-pole 60 Hz with Ns 3000 rpm; line voltage used as phase; "increase" is a decrease                        | Restate data                                    |
| Lab 1                                    | Full converter labelled continuous but uses the R-load formula; half-wave called "semi"; no load value     | Show both load cases; confirm R                 |
| LN Ch1 Parts II–III                      | Dual-converter second-converter sign omitted                                                               | Va = −(2Vm/π)cos α2                             |
| LN Ch2 Part I p12, p15, p41              | Tooth counts swapped in caption; PPR unit "steps/second"; sign typo in a two-phase table row               | 6 stator / 4 rotor; steps per revolution        |
| LN Ch3 Part II p23–25, p40–43            | Tooth and diameter fractions printed inverted; "twice" where the ratio is 3                                | Single stated convention for G                  |
| Tutorial 4 Q5 answer                     | 1 : 11.42                                                                                                  | 1 : 11.43 (80/7)                                |
| LN Ch4 Part II p7                        | "F = mgh" given as a force                                                                                 | Not a force; omit                               |
| LN Ch6 Part I p54                        | Slide titled meter-in shows meter-out                                                                      | Correct the title                               |
| Lab 2 V4                                 | Five exercises promised, four given; AND/OR order differs between objectives and body                      | Confirm                                         |
| Lab 4a Ex 2 Q3; Ex 3 prerequisites       | Advancing speed asked for a gravity-driven stroke; copied vertical-mount instruction                       | Confirm                                         |
| Lab 4b                                   | Session header 2024/2025; Ex 2 raise/lower logic reversed relative to Festo and valve option contradictory | Confirm                                         |

## 8. Questions for the lecturer

Answers will be recorded here with the date. The private reports hold a further set of
examination-specific questions.

| #    | Question                                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-1  | Confirm the corrected power factor (0.809) for LN Ch1 Part I Exercise 1                                                                               |
| L-2  | Tutorial 2 (DC) Q1: does "maximum field current" or αf = 60° govern? In (iii), what is held constant, and which firing angle is required?             |
| L-3  | Which Kv value applies in Tutorial 2 Q1 (1.5 as printed)?                                                                                             |
| L-4  | Frequency-control example: confirm breakdown torque at base frequency uses mechanical ωb (196.94 N·m), giving about 142 Hz and 4030 rpm               |
| L-5  | Lab 1: show both the resistive-load and continuous-current full-converter formulas? Will a DC motor or RL load be added? What is the load resistance? |
| L-6  | Confirm the dual-converter sign convention (α1 + α2 = π)                                                                                              |
| L-7  | Which four-quadrant diagram layout should VADL show?                                                                                                  |
| L-8  | Induction motor: is the approximate circuit the expected model? Is Vs per-phase in all problems?                                                      |
| L-9  | Gear ratio: confirm G = T_driven/T_driver as the single displayed convention                                                                          |
| L-10 | Is constant V/f (with low-frequency boost) part of the syllabus, or only the tutorial question?                                                       |
| L-11 | Are slip-power example parts (b)–(f) taught?                                                                                                          |
| L-12 | Closed-loop DC speed control: anything beyond the block diagram?                                                                                      |
| L-13 | DC-DC drives: are chopper quadrant classes or chopper-fed motor equations in the syllabus?                                                            |
| L-14 | What do the "CP2" and SP1–SP7 codes mean, and should VADL items carry them?                                                                           |
| L-15 | Stepper: is Sa = (Ns − Nr)/(Ns·Nr) × 360° meant only for variable-reluctance motors? Should VADL also teach the hybrid formula?                       |
| L-16 | Servo: is PID or time-response content taught anywhere, or is it a VADL extension?                                                                    |
| L-17 | Pneumatics: is air consumption examinable? Gauge or absolute pressure ratio?                                                                          |
| L-18 | Friction: Festo's 10 % or frictionless F = p·A as the course default?                                                                                 |
| L-19 | Cam: are SHM, cycloidal, uniform-acceleration laws or pressure angle in the syllabus?                                                                 |
| L-20 | Pulley blocks: should VADL include an efficiency input (slides say no system is 100 % efficient)?                                                     |
| L-21 | Lab benches: are they Festo TP101/TP201/TP501/TP601 sets? What are the pneumatic cylinder strokes? (D4)                                               |
| L-22 | Pneumatic supply: Lab 2 states 8 bar typical; Festo limits 6 bar. Which default and limit?                                                            |
| L-23 | Ladder notation: IEC, JIC or both?                                                                                                                    |
| L-24 | Lab 4b Ex 2: follow the UTeM text or the Festo original? What does the electrical switch control?                                                     |
| L-25 | Is a Malay interface or glossary wanted?                                                                                                              |
| L-26 | Missing decks: Ch6 Part II and the weeks 13–14 "Hydraulic vs Pneumatic" lectures. Do they exist?                                                      |
| L-27 | Which file set is current where several course codes exist (BEEI, BETI, BELK)? Is "AC Drives new" the current AC deck?                                |
