# Reference cases RC-M05-01 to RC-M05-08: servo motors and position sensors

| Field            | Value                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Module           | M05 – Servo Motors                                                                            |
| Source of case   | LN Ch2 Part II (encoder, resolver, drive signal Vcs − Vfc); DC servo cases are VADL's own     |
| Course alignment | Course servo content is qualitative; PID and time-domain specifications are extensions (L-16) |
| Worked by        | Hand calculation, 15 November 2026                                                            |
| Status           | Tests: `tests/reference/servo-motor.test.ts`                                                  |

## RC-M05-01 — quadrature encoder and resolver (LN Ch2 Part II)

- Encoder, 4 counts per line: 2¾ lines → 2.75 × 4 = **11 counts** (course example).
- 500-line encoder: one revolution = **2000 counts**; 90° = **500 counts**; resolution
  360°/2000 = **0.18°** per count.
- Channel A leads channel B for positive (clockwise) rotation; the index Z gives one pulse per
  revolution.
- Resolver at θ = 210°, reference amplitude 1: Vsin = sin 210° = **−0.5**, Vcos = cos 210° =
  **−0.866025**; both negative → **third quadrant**; atan2(−0.5, −0.866025) = **210°**.

## DC servo plant (used in RC-M05-02 to -05)

Armature-controlled, separately excited (course formula sheet: Td = J·dω/dt + Bω + TL; Eg = kφω):

La·dIa/dt = Va − Ra·Ia − kφ·ω; J·dω/dt = kφ·Ia − B·ω − TL; dθ/dt = ω.

Typical values (assumed): Ra 2 Ω, La 2 mH, kφ 0.1 V·s/rad (= N·m/A), J 1×10⁻⁴ kg·m²,
B 1×10⁻⁴ N·m·s/rad, amplifier limit ±24 V, position sensor Kfb 1 V/rad.

Drive signal (course): **Ve = Vcs − Vfc**, with Vcs = Kfb·θref and Vfc = Kfb·θ. Amplifier
Va = Kp·Ve (proportional), limited to ±24 V.

## RC-M05-02 — position servo, steady state with a load (proportional amplifier)

Kp = 5, TL = 0.05 N·m. At rest ω = 0, so kφ·Ia = TL → Ia = **0.5 A**; Va = Ra·Ia = **1 V**;
Ve = Va/Kp = 0.2 V → steady position error θref − θ = Ve/Kfb = **0.2 rad**. In general
e_ss = TL·Ra/(Kp·Kfb·kφ). With integral action (Ki > 0) the error goes to **0**.

## RC-M05-03 — position servo, step response (proportional amplifier, La → 0)

With La neglected: J·θ'' + (B + kφ²/Ra)·θ' + K·θ = K·θref, K = Kp·Kfb·kφ/Ra.

- K = 5·1·0.1/2 = **0.25 N·m/rad**; ωn = √(K/J) = √2500 = **50 rad/s**.
- 2ζωn = (B + kφ²/Ra)/J = (1×10⁻⁴ + 0.005)/1×10⁻⁴ = 51 → **ζ = 0.51**.
- Overshoot Mp = exp(−πζ/√(1 − ζ²)) = exp(−1.862 77) = **15.526 %**.
- Peak time tp = π/(ωn√(1 − ζ²)) = π/(50 × 0.860 116) = **0.073 045 s**.
- Settling time (2 %, approximation 4/(ζωn)) ≈ 0.157 s (not tested: approximation only).
- Step 1 rad: the largest amplifier demand is Kp·Kfb·1 = 5 V, below the 24 V limit.

The model keeps La. With La = 0.05 mH the simulated response must reproduce Mp and tp within
0.5 %; with the default La = 2 mH it overshoots slightly more (about 16.6 %), which the
laboratory shows as a measured value.

## RC-M05-04 — speed servo, steady state (proportional amplifier)

Tachometer Kt = 0.05 V/(rad/s); Kp = 20; reference 100 rad/s → Vcs = 5 V; TL = 0.

Steady state: Va = Kp(Vcs − Kt·ω) and Va = Ra·Ia + kφ·ω with kφ·Ia = B·ω, so

ω = Kp·Vcs / (Kp·Kt + Ra·B/kφ + kφ) = 100/(1 + 0.002 + 0.1) = **90.7441 rad/s**,
Va = **9.2559 V**, steady speed error 100 − 90.7441 = **9.2559 rad/s**. At the start
Va = Kp·Vcs = 100 V is demanded: the amplifier **saturates at 24 V**.

## RC-M05-05 — response metrics from a sampled trace (function check)

Samples of the analytic response y(t) = 1 − e^{−t/τ} with τ = 0.1 s (first order, no overshoot):
rise time 10–90 % = τ·ln 9 = **0.219 72 s**; overshoot **0 %**; 2 % settling time τ·ln 50 =
**0.391 20 s**; steady-state error **0**.

## RC-M05-06 — encoder decoding X1, X2 and X4 (Milestone 11)

A quadrature decoder can count one edge of A per line (X1), both edges of A (X2) or every edge
of A and B (X4, the course's "4 counts per line"). Counts per revolution = m·L and resolution =
360°/(m·L), with m = 1, 2 or 4.

500-line encoder at θ = 1 rad (57.2958°): line phase = 500 × 1/(2π) = 79.5775 lines.

| Decoding | Counts per rev | Resolution | Count at 1 rad      | Reported angle           |
| -------- | -------------- | ---------- | ------------------- | ------------------------ |
| X1       | 500            | 0.72°      | ⌊79.5775⌋ = **79**  | 79 × 0.72° = **56.88°**  |
| X2       | 1000           | 0.36°      | ⌊159.155⌋ = **159** | 159 × 0.36° = **57.24°** |
| X4       | 2000           | 0.18°      | ⌊318.310⌋ = **318** | 318 × 0.18° = **57.24°** |

## RC-M05-07 — resolver-to-digital converter (Milestone 11)

An n-bit resolver-to-digital converter (RDC) reports the angle as a count of 2ⁿ per revolution:
count = ⌊θ·2ⁿ/(2π)⌋, resolution = 360°/2ⁿ.

At θ = 1 rad (1/(2π) = 0.1591549 rev):

- 12 bits: 2¹² = 4096; 0.1591549 × 4096 = 651.899 → count **651**; resolution 360°/4096 =
  **0.087890625°**; reported angle 651 × 0.087890625° = **57.216797°**.
- 14 bits: 2¹⁴ = 16384; 0.1591549 × 16384 = 2607.59 → count **2607**; resolution
  **0.02197266°**; reported angle 2607 × 0.02197266° = **57.28271°**.

## RC-M05-08 — AC two-phase servo motor (extension, Milestone 11)

Linearised two-phase servo motor (straight, parallel torque–speed lines, the usual textbook
model): **Td = Kc·Vc − Kω·ω**, with Kc = Tst/Vmax (stall torque Tst at rated control voltage
Vmax) and Kω = Tst/ω0 (no-load speed ω0 at rated control voltage). The sign of Vc is the control
phase: in phase (0°) drives clockwise, 180° drives anticlockwise.

Assumed values: Tst 0.12 N·m, Vmax 24 V, ω0 300 rad/s, J 1×10⁻⁴ kg·m², B 1×10⁻⁴ N·m·s/rad.

- Kc = 0.12/24 = **0.005 N·m/V**; Kω = 0.12/300 = **4×10⁻⁴ N·m·s/rad**.
- Position servo, Kp 5, Kfb 1 V/rad: J·θ″ + (B + Kω)·θ′ + K·θ = K·θref with
  K = Kc·Kp·Kfb = 0.005 × 5 × 1 = **0.025 N·m/rad**.
  - ωn = √(K/J) = √(0.025/1×10⁻⁴) = √250 = **15.8114 rad/s**.
  - ζ = (B + Kω)/(2√(K·J)) = 5×10⁻⁴/(2 × √(2.5×10⁻⁶)) = 5×10⁻⁴/3.16228×10⁻³ = **0.158114**.
- Holding a load TL = 0.01 N·m: Kc·Kp·Kfb·e = TL → e = 0.01/0.025 = **0.4 rad** (22.918°);
  control voltage Vc = Kp·Kfb·e = **2 V** (below the 24 V limit).
- Speed servo, Kp 20, tachometer Kt 0.05 V·s/rad, reference 100 rad/s (Vcs = 5 V), no load:
  Kc·Kp·(Vcs − Kt·ω) = (B + Kω)·ω → ω = Kc·Kp·Vcs/(Kc·Kp·Kt + B + Kω)
  = (0.005 × 20 × 5)/(0.005 × 20 × 0.05 + 5×10⁻⁴) = 0.5/0.0055 = **90.9091 rad/s**;
  Vc = 20 × (5 − 0.05 × 90.9091) = **9.0909 V** (below the limit).

## Tolerances

Sensor cases: exact (counts) or 1e−6. RC-M05-02 and -04 steady states: 1e−4 relative.
RC-M05-03 against the second-order formulas: 0.5 %. RC-M05-05: within one sample interval
(1 ms) for times.
