# Simulation model: power converters

| Field            | Value                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Model id         | `m03.power-converter`                                                                                 |
| Module           | M03 – Power Converters (course Lab 1)                                                                 |
| Model class      | dynamic in form (state = time); waveforms from ideal switching functions                              |
| Source files     | `src/sim-core/equations/waveforms.ts`, `src/sim-core/models/powerConverter.ts`                        |
| Reference cases  | `docs/reference-cases/power-converters.md` (RC-M03-01 to -04), `dc-converter-voltages.md` (RC-M01-04) |
| Status           | draft, verified by automated tests; awaiting lecturer review                                          |
| Course alignment | LN Ch1 Part I (rectifiers, choppers, inverters), Part II (converter drives), Lab 1                    |

## 1. Purpose

Shows the waveforms behind the course's average-voltage formulas: how the firing angle shapes
a rectifier output, how duty cycle sets a chopper output and its ripple, and how PWM builds an
inverter output. Lab 1 is reproduced exactly (supply voltages and firing angles).

## 2. Circuits

- Rectifiers (supply angle θ = 2πft): diode half-wave and bridge; thyristor half-wave and bridge
  on a resistive load (Lab 1); full and semi bridges on a highly inductive load; three-phase
  six-pulse bridge on an inductive load.
- DC-DC: buck, boost, buck-boost in continuous conduction (triangular inductor current).
- Inverters (θ = 2πf1t): single-phase square wave, bipolar and unipolar sinusoidal PWM;
  three-phase six-step and sinusoidal PWM (line voltage).

## 3. Method

Instantaneous values are closed-form functions of time. Statistics are computed by the midpoint
rule over one period. For rectifiers the period is split at the switching instants (zero
crossings, firing angles and, for the three-phase bridge, the segment edges), so no sample
straddles the jump at α and 4000 samples per supply cycle give averages and rms to about
1e−9 relative. Inverters: Fourier fundamental and THD with 40 000 samples. Inductor rms: 4000
samples. Results are cached per parameter set. The time step is 1/1000 of a
supply cycle, 1/100 of a switching period, or 1/100 of a carrier period.

## 4. Assumptions and limitations

See `powerConverterModel.assumptions`: ideal switches; no source inductance or overlap; inductive
loads with ripple-free current (a passive load cannot sustain a negative average — shown as zero
current); choppers in continuous conduction (warning with Lmin when not); output voltage of
choppers drawn without ripple (ripple given numerically); inverters on resistive loads with
integer mf. Not a substitute for PSIM or other circuit simulators.

## 5. Verification

Every Lab 1 average and rms (RC-M01-04, RC-M03-01) by numerical integration; form and ripple
factors; rectification efficiency; course Exercise 1; inductive full, semi and three-phase
bridges (RC-M03-02); buck, boost, buck-boost (RC-M03-03); inverter rms, fundamental and THD
against closed form (RC-M03-04). Input power factor checked against 1, 1/√2 and (2√2/π)cos α.
Files: `tests/reference/power-converters.test.ts`, `tests/unit/sim-core/powerConverter.test.ts`.
