# Reference cases RC-M01-06 to RC-M01-11: converter-fed armature waveforms

| Field            | Value                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Module           | M01 – DC Motor Drives (drive waveform view, Milestone 11)                                           |
| Source of case   | Standard single-phase converter analysis with an R–L–E load; VADL's own numbers                     |
| Course alignment | The course gives the average-voltage formulas; instantaneous waveforms are an extension (L-5, L-13) |
| Worked by        | Hand calculation, 16 November 2026                                                                  |
| Status           | Tests: `tests/reference/drive-waveforms.test.ts`                                                    |

## Model

Over one supply cycle the speed is taken as constant, so the back-emf E is constant. With supply
vs = Vm·sin θ (θ = ωt) and armature R, L:

ωL·di/dθ = v(θ) − E − R·i while a path conducts; i = 0 and v = E while none conducts.

A thyristor path turns on when it is gated and forward biased (v(θ) > E), and turns off when its
current falls to zero. Supply for every case: 240 V rms, 50 Hz, so Vm = 240 × √2 = **339.411 V**,
ω = 314.159 rad/s, 2Vm/π = **216.076 V**, Vm/π = **108.038 V**, Vm/2π = **54.019 V**.

## RC-M01-06 — full converter, continuous conduction

α = 30°, R = 2 Ω, L = 50 mH (ωL = 15.708 Ω), E = 150 V.

- Average voltage: (2Vm/π)·cos α = 216.076 × 0.866025 = **187.128 V**.
- Average current: (187.128 − 150)/2 = **18.564 A**.
- Current at the firing instant. With Z = √(R² + ω²L²) = √(4 + 246.740) = 15.8348 Ω,
  tan φ = 7.85398, φ = 82.7438°, s(θ) = (Vm/Z)·sin(θ − φ), q = e^{−π/tan φ} = e^{−0.4} = 0.670320:
  i(θ) = s(θ) − E/R + A·e^{−(θ−α)/tan φ}, and i(π + α) = i(α) gives A = −2·s(α)/(1 − q).
  s(α) = 21.4346 × sin(−52.7438°) = −17.0606; A = 34.1212/0.329680 = 103.498;
  i(α) = −17.0606 − 75 + 103.498 = **11.437 A** (positive, so conduction is continuous).

## RC-M01-07 — full converter, discontinuous conduction (R = 0)

α = 60°, R = 0, L = 5 mH (ωL = 1.5708 Ω), E = Vm/2 = 169.706 V.

i(θ) = [Vm(cos α − cos θ) − E(θ − α)]/(ωL) from θ = α until it returns to zero at β:
cos α − cos β = 0.5·(β − α) (angles in radians).

- By trial: β = 212° gives +0.0216, β = 213.2° gives −0.0002, so **β ≈ 213.2°**, less than
  π + α = 240°: the current is discontinuous. Conduction angle β − α ≈ **153.2°**.
- Peak current where vs = E (θ = 150°):
  [339.411 × 1.366025 − 169.706 × 1.570796]/1.570796 = 197.07/1.5708 = **125.46 A**.
- Average current over the half cycle: (1/(π·ωL))·{Vm[cos α·(β − α) − (sin β − sin α)] − E(β − α)²/2}
  = [339.411 × 2.750505 − 169.706 × 3.57471]/4.934802 = 326.90/4.9348 = **66.24 A**.

## RC-M01-08 — semi-converter, continuous conduction

α = 60°, R = 2 Ω, L = 50 mH, E = 120 V. Output is |vs| from α to π and zero while the current
freewheels from π to π + α.

- Average voltage: (Vm/π)(1 + cos α) = 108.038 × 1.5 = **162.057 V**.
- Average current: (162.057 − 120)/2 = **21.029 A**.

## RC-M01-09 — half-wave converter with freewheeling diode, continuous conduction

α = 60°, R = 2 Ω, L = 100 mH, E = 40 V. Output is vs from α to π and zero for the rest of the
cycle.

- Average voltage: (Vm/2π)(1 + cos α) = 54.019 × 1.5 = **81.028 V**.
- Average current: (81.028 − 40)/2 = **20.514 A**.

## RC-M01-10 — full converter inverting with an overhauling load (regeneration)

α = 150°, R = 2 Ω, L = 50 mH, E = −220 V (the load drives the motor in reverse).

- Average voltage: 216.076 × cos 150° = **−187.128 V**.
- Average current: (−187.128 + 220)/2 = **16.436 A** (positive).
- Power at the converter terminals ≈ average voltage × average current when the ripple is small:
  −187.128 × 16.436 ≈ **−3076 W**: power flows back to the supply. Speed negative, torque
  positive: **quadrant IV** (reverse braking).

## RC-M01-11 — dual converter, circulating current

α1 = 60°, α2 = 180° − 60° = 120°, reactor Lr = 50 mH (ωLr = 15.708 Ω).

The two converters have equal average voltages but different instantaneous voltages. Their
difference appears across the reactor: vr = 2Vm·sin θ for π − α1 ≤ θ ≤ π + α1 and zero for the rest
of the half cycle, so

ir(θ) = (2Vm/ωLr)·(−cos α1 − cos θ), zero at both ends and greatest at θ = π.

- Peak circulating current: (2Vm/ωLr)(1 − cos α1) = (678.822/15.708) × 0.5 = **21.608 A**.
- Average load voltage: (2Vm/π)·cos α1 = 216.076 × 0.5 = **108.038 V**.
- With R = 2 Ω and E = 150 V the average load current is (108.038 − 150)/2 = **−20.981 A**: the
  current reverses without any dead time, because converter 2 is already conducting.

## Tolerances

Average voltages in continuous conduction: 0.2 %. Currents: 0.5 % (RC-M01-06 firing-instant
current and RC-M01-07 values: 1 %, the hand calculation carries four significant figures).
Extinction angle: ±0.3°.
