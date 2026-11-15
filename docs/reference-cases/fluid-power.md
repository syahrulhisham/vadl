# Reference cases RC-M08 to RC-M10: pneumatics, electro-pneumatics, hydraulics

| Field            | Value                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Modules          | M08 Pneumatics, M09 Electro-pneumatics, M10 Electrohydraulics                                             |
| Source of case   | Festo TP101/TP201/TP501/TP601 workbooks used by course Labs 2, 3, 4a, 4b (values recomputed with exact π) |
| Course alignment | course-alignment §5.8–5.10; friction 10 % of theoretical force (Festo), MPa for hydraulics                |
| Worked by        | Hand calculation, 15 November 2026 (flow-model cases: independent numerical calculation, stated)          |
| Status           | Tests: `tests/reference/fluid-power.test.ts`                                                              |

## RC-M08-01 — cylinder forces (Festo TP101 p.28, p.49; plan case)

A = πD²/4; annulus A' = π(D² − d²)/4; F_th = p·A; F_eff = 0.9·p·A − F_spring (10 % friction).

| Case                                        | Result                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Single-acting D 20 mm, 6 bar, spring 13.6 N | A = 3.14159 × 10⁻⁴ m²; F_th **188.496 N**; F_eff **156.046 N**              |
| Double-acting 20/8 mm, 6 bar                | Extend **169.646 N**; A' = 2.63894 × 10⁻⁴ m²; retract **142.503 N**         |
| Plan case 50/20 mm, 6 bar                   | Ideal **1178.10 N / 989.602 N**; with 10 % friction **1060.29 / 890.642 N** |

## RC-M08-02 — VADL speed model (not a course formula; independent numerical check)

The course gives no pneumatic speed formula (§5.8). VADL's model: quasi-static, isothermal
(293.15 K) air, orifice flow through effective areas (valve passage 1.5 mm², one-way flow
control up to 2 mm², restrictions in series combine as 1/A² = Σ 1/Aᵢ²), with the standard
compressible orifice law (critical pressure ratio 0.528 for γ = 1.4).

- **Choked meter-out speed** (closed form): when the exhaust flow is choked the volumetric flow
  at chamber conditions is A_out·√(γRT)·(2/(γ+1))^((γ+1)/(2(γ−1))) = A_out × **198.612 m/s**,
  independent of the chamber pressure. 20/8 mm cylinder, flow control at 20 % (0.4 mm²):
  A_out = (1/1.5² + 1/0.4²)^(−1/2) mm² = **0.386494 mm²**, v = 0.386494 × 10⁻⁶ × 198.612 /
  2.63894 × 10⁻⁴ = **0.290884 m/s**, for loads up to about 150 N (load-independent).
- **Meter-in** at the same setting (independent numerical solution): **0.934 m/s** with no load,
  **0.527 m/s** with 50 N, **0.157 m/s** with 150 N (load-dependent), within 1 %.
- Meter-out with no load: exhaust-chamber pressure **6.25 bar**, above the 6 bar supply
  (pressure intensification by the area ratio).

## RC-M09-01 — electrical values (Festo TP201 p.67, p.86; TP601 p.64)

- Solenoid coil 48 Ω at 24 V DC: I = **0.5 A**, P = **12 W**. 36 W coil: **1.5 A**.
- Relay coil 580 Ω, 1 W: U = √(P·R) = **24.0832 V**; at 24 V: **41.3793 mA**, **0.993103 W**.
- Contact ratings: push button 2 A, relay contact 5 A. Three 12 W coils (1.5 A) on one push
  button are within 2 A; four (2 A) reach the limit — the reason for indirect control.

## RC-M09-02 — ladder logic (Lab 3 Parts B and D; latching)

- Indirect control: S1 → K1; K1 (NO) → 1M1. Pressing S1 energises K1 and 1M1 in the same scan.
- Latch with dominant reset: K1 = (S1 OR K1) AND NOT S2. Pressing S1 then releasing holds K1;
  pressing S1 and S2 together leaves K1 off.
- Part D sequence 1A1+ 2A1+ 1A1− 2A1−: from rest, S1 → 1A1 extends; at 1B2 → 2A1 extends; at
  2B2 with S1 released → 1A1 retracts; 1B2 opens → 2A1 retracts. Order of events: **1A1+,
  2A1+, 1A1−, 2A1−**.

## RC-M10-01 — hydraulics (Festo TP501 = Lab 4a; TP601 = Lab 4b)

Lab cylinder 16/10/200 mm; lab calculations use A_P = 2.0 cm², A_PR = 1.2 cm², q = 2 L/min.

| Case                                    | Result                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Load pressure, 90 N on the annulus (H5) | p_L = 90/1.2 × 10⁻⁴ = **0.75 MPa**                                                                   |
| Retract (H6, H8)                        | v = **0.277778 m/s**, t = **0.72 s**                                                                 |
| Advance (H7)                            | φ = **1.66667**, v = **0.166667 m/s**, t = **1.2 s**                                                 |
| Ratios (H8)                             | speed ratio **0.6**, time ratio **1.66667**                                                          |
| Exact 16/10 mm areas                    | 201.062 / 122.522 mm², ratio **1.64103**; stall at 5 MPa **1005.31 N** extend, **612.611 N** retract |
| Back pressure (H9)                      | D 50, d 25 mm, 50 bar / 6 bar: **9817.48 − 883.573 = 8933.90 N**                                     |
| Fill time (H10)                         | D 50 mm, s 250 mm, 5 L/min: **5.89049 s**                                                            |
| Drive power, η = 0.7 (H12)              | 5 MPa, 2 L/min: **238.095 W**; 0.3 MPa: **14.2857 W**                                                |
| Pump flow (H1, H13)                     | 2.8 cm³ × 1450 rpm = **4.06 L/min**; 1.6 cm³ × 1390 rpm = **2.224 L/min**                            |

## RC-M10-02 — VADL hydraulic flow model (independent numerical check)

Incompressible oil (ρ = 870 kg/m³), orifice flow q = A_eff·√(2Δp/ρ). The valve and line passage
is calibrated to the course measurement H5 (0.05 MPa between traversing and load pressure at
2 L/min): A_v = q/√(2Δp/ρ) = 3.33333 × 10⁻⁵/√(2 × 5 × 10⁴/870) = **3.10913 mm²**. Relief valve:
opens 0.4 MPa below its setting (course measurement), passing the full pump flow at the setting.

- Relief flow with setting 5 MPa and 2 L/min pump: **0** at 4.6 MPa, **1 L/min** at 4.8 MPa,
  **2 L/min** at 5.0 MPa.
- Lowering the 90 N load by gravity through the one-way flow control (up to 3 mm²) and valve
  passage in series, annulus pressure 0.75 MPa: fully open **5.37853 L/min** (0.747018 m/s on
  A_PR = 1.2 cm²); half open **3.36581 L/min**; quarter open **1.81642 L/min** (0.252281 m/s).
- Raising the 90 N load at 2 L/min: annulus 0.75 MPa, plus 0.05 MPa passage, plus the 0.6 MPa
  non-return valve: pump pressure **1.40 MPa**.

## Tolerances

Formula cases relative 1e−5. Flow-model cases: closed-form choked case 1e−5; numerical cases 1 %.
