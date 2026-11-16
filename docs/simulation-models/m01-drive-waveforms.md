# Simulation model — M01 drive waveforms (converter-fed armature)

| Field            | Value                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Model id         | `m01.drive-waveforms` (a computed view, not a registered dynamic model)                      |
| Module           | M01 – DC Motor Drives, "Drive waveforms" view                                                |
| Model class      | periodic steady state over one supply cycle                                                  |
| Source files     | `src/sim-core/equations/driveWaveforms.ts`; view `src/modules/m01-dc-motor/DriveScope.tsx`   |
| Status           | Extension (Milestone 11). The course gives the average-voltage formulas only (L-5, L-13)     |
| Design reference | The owner's earlier single-file "Single-Phase DC Drive Interactive Simulator" (concept only) |

## 1. Purpose

Shows what lies behind the average armature voltage: the instantaneous armature voltage and
current of a single-phase converter over one supply cycle, which devices conduct, when the current
becomes discontinuous, and how a full or dual converter returns power to the supply.

## 2. Symbols and units

| Symbol | Meaning                                       | Unit |
| ------ | --------------------------------------------- | ---- |
| vs, Vm | supply voltage vs = Vm·sin θ, and its peak    | V    |
| θ      | supply angle ωt                               | rad  |
| α      | firing angle (α1 for a dual converter)        | rad  |
| R, L   | armature circuit resistance (Ra + Rst) and La | Ω, H |
| E      | back-emf Eg, constant over the cycle          | V    |
| va, ia | armature voltage and current                  | V, A |
| β      | extinction angle (current returns to zero)    | rad  |
| Lr, ir | circulating-current reactor and its current   | H, A |

## 3. Governing equations

- While a path conducts: ωL·dia/dθ = va(θ) − E − R·ia. While none conducts: ia = 0 and va = E.
- A path turns on when it is gated and forward biased (va(θ) > E); it turns off when ia falls to
  zero.
- va while conducting: half-wave with freewheeling diode, vs from α to π, else 0; semi-converter,
  |vs| from α to π in each half cycle, else 0 (freewheeling); full converter, vs from α to π + α,
  then −vs.
- Dual converter, non-circulating: one full converter is enabled; converter 2 is the mirror image
  (current ≤ 0) fired at α2 = π − α1.
- Dual converter, circulating: both conduct; the load sees the mean of the two converter voltages
  and its current may take either sign. The reactor carries the difference:
  ir(θ) = (1/ωLr)·∫(v1 + v2) dθ, never negative; its peak is (2Vm/ωLr)(1 − |cos α1|).
- Averages in continuous conduction (course formulas): (Vm/2π)(1 + cos α), (Vm/π)(1 + cos α),
  (2Vm/π)·cos α.
- Quadrant from the signs of E (speed) and the average ia (torque).

## 4. Assumptions

Constant speed, and so constant E, over the supply cycle. Ideal switches, instant line
commutation, no source inductance. Gate pulses long enough that a thyristor turns on as soon as
it is gated and forward biased. Linear armature circuit.

## 5. Limitations

- Not a transient simulation: it shows the repeating waveform for the present speed. The
  laboratory's dynamic model still uses the average converter voltage, so the two agree in the
  average only when conduction is continuous.
- With E taken from the laboratory, the view is a snapshot at that speed.
- Circulating mode neglects the reactor drop in the load path and takes α2 = π − α1 exactly.
- No commutation overlap, device drops, harmonics on the supply side or field-converter ripple.
- With R = 0 and a net average voltage there is no steady state; the view says so.
- Single-phase converters only.

## 6. Parameters and valid ranges

Supply 50–500 V rms (laboratory value), 40–70 Hz; α 0–180°; R = Ra + Rst ≥ 0; L = La > 0;
E −300…300 V when set by hand; Lr 5–500 mH.

## 7. Numerical method

Fourth-order Runge–Kutta on a 0.1° grid (3600 steps per cycle), repeated cycle after cycle until
the current at the end of a cycle equals that at its start (within 1×10⁻⁷ of the current scale;
at most 400 cycles). Averages of va and va·ia are integrated on the same grid with Simpson's rule
and one-sided values at the step ends, so the jumps at the firing instants are not smeared.
Output is sampled every 0.5°.

## 8. Outputs

Waveforms va(θ), ia(θ), vs(θ), ir(θ); the conducting path at each angle; average and rms
current, minimum and maximum current, average voltage, average power, conduction mode, extinction
and conduction angles, peak circulating current, quadrant.

## 9. Verification

| Case      | Expected                                                    | Tolerance    | Test file                                 |
| --------- | ----------------------------------------------------------- | ------------ | ----------------------------------------- |
| RC-M01-06 | 187.128 V, 18.564 A, 11.437 A at firing; continuous         | 0.2 %–1 %    | `tests/reference/drive-waveforms.test.ts` |
| RC-M01-07 | β ≈ 213.2°, peak 125.46 A, average 66.24 A; discontinuous   | 1 %, ±0.8°   | same                                      |
| RC-M01-08 | Semi-converter: 162.057 V, 21.029 A; freewheeling 180°–240° | 0.2 %, 0.5 % | same                                      |
| RC-M01-09 | Half-wave: 81.028 V, 20.514 A                               | 0.2 %, 0.5 % | same                                      |
| RC-M01-10 | Inversion: −187.128 V, +16.436 A, ≈ −3076 W, quadrant IV    | 0.2 %–5 %    | same                                      |
| RC-M01-11 | Dual: ir peak 21.608 A; load 108.038 V, −20.981 A           | 0.5 %        | same                                      |

Hand calculations: `docs/reference-cases/drive-waveforms.md`.

## 10. Change log

| Date        | Change        | By           |
| ----------- | ------------- | ------------ |
| 16 Nov 2026 | First version | Milestone 11 |
