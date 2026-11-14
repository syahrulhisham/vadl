/**
 * The dynamic DC motor model must settle to the hand-calculated steady states
 * (RC-M01-01, RC-M01-02, RC-M01-05). Literals from docs/reference-cases.
 */
import { describe, expect, it } from 'vitest';
import { DC_PRESETS, dcMotorModel, SimulationRunner, type DcMotorParams } from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-4) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);

function settle(p: DcMotorParams, seconds = 3) {
  const r = new SimulationRunner(dcMotorModel, p);
  r.runFor(seconds);
  return r.outputs;
}

describe('dynamic model settles to the algebraic steady state', () => {
  it('RC-M01-01: Ia 20 A, ω 175 rad/s, Eg 210 V, 1671.13 rpm', () => {
    const out = settle(DC_PRESETS.separatelyExcited);
    rel(out.armatureCurrent, 20);
    rel(out.speed, 175);
    rel(out.backEmf, 210);
    rel(out.speedRpm, 1671.13);
    rel(out.torque, 24);
  });

  it('RC-M01-01 efficiency including the 220 W field: Pout 4200 W of Pin 4620 W = 90.909 %', () => {
    // Armature 4400 W (RC-M01-01) plus field Vf·If = 220 V × 1 A.
    const out = settle(DC_PRESETS.separatelyExcited);
    rel(out.outputPower, 4200);
    rel(out.inputPower, 4620);
    rel(out.efficiency, 0.909091);
  });

  it('shunt motor with Rf 220 Ω on 220 V behaves like RC-M01-01 (If = 1 A)', () => {
    const out = settle(DC_PRESETS.shunt);
    rel(out.fieldCurrent, 1);
    rel(out.speed, 175);
  });

  it('RC-M01-02 converter-fed drive: Va 198.070 V, If 2.26365 A, Ia 45 A, ω 58.9501 rad/s', () => {
    const out = settle(DC_PRESETS.converterFed, 6);
    rel(out.armatureVoltage, 198.07);
    rel(out.fieldCurrent, 2.26365);
    rel(out.armatureCurrent, 45);
    rel(out.speed, 58.9501);
    rel(out.inputPower, 9809.85);
  });

  it('RC-M01-05 series motor: Ia 31.6228 A, ω 161.425 rad/s, η 92.813 %', () => {
    const out = settle(DC_PRESETS.series, 4);
    rel(out.armatureCurrent, 31.6228);
    rel(out.speed, 161.425);
    rel(out.efficiency, 0.92813);
  });

  it('RC-M01-05 viscous friction B 0.01: ω 174.394 rad/s, Ia 21.4533 A', () => {
    const out = settle({ ...DC_PRESETS.separatelyExcited, friction: 0.01 });
    rel(out.speed, 174.394);
    rel(out.armatureCurrent, 21.4533);
  });

  it('RC-M01-05 field weakening: If 0.5 A, load 12 N·m → ω 350 rad/s', () => {
    const out = settle(
      { ...DC_PRESETS.separatelyExcited, fieldVoltage: 110, loadRatedTorque: 12 },
      5,
    );
    rel(out.fieldCurrent, 0.5);
    rel(out.speed, 350);
    rel(out.armatureCurrent, 20);
  });
});

describe('starting transient', () => {
  it('the first step draws the RC-M01-05 starting current: Va/R = 440 A without, 40 A with Rst 5 Ω', () => {
    // Initial di/dt = Va/La; the current is limited by R only as the transient develops.
    // The peak is below Va/R because back-emf builds as the rotor accelerates.
    const peak = (p: DcMotorParams) => {
      const r = new SimulationRunner(dcMotorModel, p);
      r.runFor(0.5);
      return Math.max(...r.trace().map((s) => s.values.armatureCurrent as number));
    };
    const without = peak(DC_PRESETS.separatelyExcited);
    const withRst = peak({ ...DC_PRESETS.separatelyExcited, rst: 5 });
    expect(without).toBeLessThan(440);
    expect(without).toBeGreaterThan(200);
    expect(withRst).toBeLessThan(40);
    expect(withRst).toBeGreaterThan(24);
  });
});
