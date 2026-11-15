/**
 * RC-M02-01 to RC-M02-05. Literals from docs/reference-cases/ac-motor.md.
 */
import { describe, expect, it } from 'vitest';
import {
  AC_PRESETS,
  airGapPower,
  circuitAtFrequency,
  inductionMotorModel,
  inductionTorque,
  inputImpedance,
  maxTorque,
  phaseVoltage,
  radToDeg,
  rotorCurrent,
  rotorFrequency,
  SimulationRunner,
  slip,
  slipAtMaxTorque,
  startingTorque,
  synchronousSpeed,
  synchronousSpeedRpm,
  type ImCircuit,
  type InductionMotorParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-5) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);

const M1: ImCircuit = { rs: 0.42, rr: 0.23, xs: 0.82, xr: 0.82, xm: 22 };
const M2: ImCircuit = { rs: 0, rr: 0.38, xs: 1.14, xr: 1.71, xm: 33.2 };

describe('RC-M02-01 performance (AC tutorial Q1)', () => {
  const vs = phaseVoltage(460);
  const ws = synchronousSpeed(60, 4);
  const s = slip(ws, (1750 * 2 * Math.PI) / 60);

  it('Vs 265.581 V, ωs 188.496 rad/s, S 0.0277778', () => {
    rel(vs, 265.581);
    rel(ws, 188.496);
    rel(s, 0.0277778);
  });

  it('Zi 7.7321 Ω ∠30.88°, Is 34.348 A, PF 0.8582, Ir 29.998 A', () => {
    const zi = inputImpedance(M1, s);
    rel(zi.magnitude, 7.7321);
    rel(radToDeg(zi.angle), 30.88, 1e-4);
    rel(vs / zi.magnitude, 34.348);
    rel(Math.cos(zi.angle), 0.8582, 1e-4);
    rel(rotorCurrent(vs, M1, s), 29.998);
  });

  it('Pg 22 353.4 W, Td 118.588 N·m, Pin 23 487.2 W = Pg + Pscu', () => {
    rel(airGapPower(vs, M1, s), 22353.4);
    rel(inductionTorque(vs, ws, M1, s), 118.588);
    const zi = inputImpedance(M1, s);
    const pin = 3 * vs * (vs / zi.magnitude) * Math.cos(zi.angle);
    rel(pin, 23487.2);
    const ir = rotorCurrent(vs, M1, s);
    rel(airGapPower(vs, M1, s) + 3 * ir * ir * M1.rs, 23487.2);
  });

  it('Smax 0.135859, Tmax 265.644 N·m, Tst 82.964 N·m', () => {
    rel(slipAtMaxTorque(M1), 0.135859);
    rel(maxTorque(vs, ws, M1), 265.644);
    rel(startingTorque(vs, ws, M1), 82.964);
  });
});

describe('RC-M02-02 constant V/f (AC tutorial Q4)', () => {
  it.each([
    [60, 265.581, 188.496, 0.133333, 163.363],
    [30, 132.791, 94.2478, 0.266667, 69.115],
  ])('%i Hz: Vs %f, ωs %f, Smax %f, Tmax 196.943 N·m at ωm %f', (f, v, w, sm, wm) => {
    const c = circuitAtFrequency(M2, f, 60);
    const vs = phaseVoltage(460) * (f / 60);
    const ws = synchronousSpeed(f, 4);
    rel(vs, v);
    rel(ws, w);
    rel(slipAtMaxTorque(c), sm);
    rel(maxTorque(vs, ws, c), 196.943);
    rel(ws * (1 - slipAtMaxTorque(c)), wm);
  });
});

describe('RC-M02-03 stator-voltage control (AC tutorial Q2)', () => {
  it('Vs 137.929 V gives Td = TL 32.5349 N·m at 1550 rpm with Ir 20.285 A', () => {
    const c: ImCircuit = { rs: 1.01, rr: 0.69, xs: 1.3, xr: 1.94, xm: 43.5 };
    const ws = synchronousSpeed(60, 4);
    const s = slip(ws, (1550 * 2 * Math.PI) / 60);
    rel(s, 0.138889);
    rel(inductionTorque(137.929, ws, c, s), 32.5349, 2e-5);
    rel(rotorCurrent(137.929, c, s), 20.285);
    rel(137.929 / phaseVoltage(460), 0.519347);
  });
});

describe('RC-M02-04 basics and rotor resistance', () => {
  it('Ns 1500 rpm (4 poles, 50 Hz), S 0.04 at 1440 rpm, fr 2 Hz, Ns 900 rpm at 30 Hz', () => {
    rel(synchronousSpeedRpm(50, 4), 1500);
    rel(slip(1500, 1440), 0.04);
    rel(rotorFrequency(0.04, 50), 2);
    rel(synchronousSpeedRpm(30, 4), 900);
  });

  it("adding Rx' 0.23 Ω keeps torque 118.588 N·m at S 0.0555556 (1700 rpm)", () => {
    const vs = phaseVoltage(460);
    const ws = synchronousSpeed(60, 4);
    rel(inductionTorque(vs, ws, { ...M1, rr: 0.46 }, 0.0555556), 118.588);
  });
});

describe('RC-M02-05 frequency control above base (corrected)', () => {
  it('Tmb 196.943 N·m, β 2.37212, f 142.327 Hz, Ns 4269.81 rpm, Smax 0.0562086, 4029.81 rpm', () => {
    const vs = phaseVoltage(460);
    const tmb = maxTorque(vs, synchronousSpeed(60, 4), M2);
    rel(tmb, 196.943);
    const beta = Math.sqrt(tmb / 35);
    rel(beta, 2.37212);
    const f = 60 * beta;
    rel(f, 142.327);
    rel(synchronousSpeedRpm(f, 4), 4269.81);
    const c = circuitAtFrequency(M2, f, 60);
    rel(slipAtMaxTorque(c), 0.0562086);
    rel(synchronousSpeedRpm(f, 4) * (1 - slipAtMaxTorque(c)), 4029.81);
    rel(maxTorque(vs, synchronousSpeed(f, 4), c), 35);
  });
});

describe('dynamic model settles to the reference operating points', () => {
  const settle = (p: InductionMotorParams, seconds = 4) => {
    const r = new SimulationRunner(inductionMotorModel, p);
    r.runFor(seconds);
    return r.outputs;
  };

  it('RC-M02-01 preset: 1750 rpm, Td 118.588 N·m, η 92.273 % (60 W no-load loss as B·ω)', () => {
    const out = settle(AC_PRESETS.performance);
    rel(out.speedRpm, 1750, 1e-4);
    rel(out.torque, 118.588, 1e-4);
    rel(out.statorCurrent, 34.348, 1e-4);
    rel(out.efficiency, 0.92273, 1e-4);
  });

  it('RC-M02-03 preset: b 0.519347 brings the fan load to 1550 rpm', () => {
    rel(settle(AC_PRESETS.statorVoltage).speedRpm, 1550, 1e-4);
  });

  it("RC-M02-04 preset: external Rx' 0.23 Ω gives 1700 rpm at 118.588 N·m", () => {
    const out = settle(AC_PRESETS.rotorResistance);
    rel(out.speedRpm, 1700, 1e-4);
    rel(out.torque, 118.588, 1e-4);
  });
});
