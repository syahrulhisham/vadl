import { describe, expect, it } from 'vitest';
import {
  AC_CONTROLS,
  AC_PRESETS,
  acLoadTorqueAtSpeed,
  acSupply,
  acTorqueAtSpeed,
  inductionMotorModel,
  inductionTorque,
  inputImpedance,
  passiveLoadTorque,
  rotorCurrent,
  SimulationRunner,
  type InductionMotorParams,
} from '@/sim-core';

const P = AC_PRESETS.performance;

describe('validation', () => {
  it('accepts every preset and lists five control methods', () => {
    expect(AC_CONTROLS).toHaveLength(5);
    for (const p of Object.values(AC_PRESETS)) {
      expect(inductionMotorModel.validate(p).filter((i) => i.severity === 'error')).toEqual([]);
    }
  });

  it('rejects bad poles and out-of-range values with the range', () => {
    const issues = inductionMotorModel.validate({ ...P, poles: 5, rr: 0 });
    expect(issues.map((i) => i.parameter)).toEqual(['poles', 'rr']);
    expect(issues[1]?.message).toBe("Rotor resistance Rr' must be between 0.01 and 10 Ω.");
  });

  it('checks only the knob the control method uses', () => {
    expect(inductionMotorModel.validate({ ...P, voltageFactor: 5 })).toEqual([]);
    expect(
      inductionMotorModel.validate({ ...P, control: 'stator-voltage', voltageFactor: 5 })[0]
        ?.parameter,
    ).toBe('voltageFactor');
  });

  it('warns that constant voltage below rated frequency over-fluxes the motor', () => {
    const issues = inductionMotorModel.validate({ ...AC_PRESETS.aboveBase, frequency: 30 });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toMatch(/saturate/);
  });
});

describe('supply for each control method', () => {
  it('DOL uses rated voltage and frequency; stator-voltage scales V; V/f scales both', () => {
    expect(acSupply(P).frequency).toBe(60);
    expect(acSupply(P).phaseVoltage).toBeCloseTo(265.581, 3);
    expect(
      acSupply({ ...P, control: 'stator-voltage', voltageFactor: 0.5 }).phaseVoltage,
    ).toBeCloseTo(132.79, 2);
    const vf = acSupply({ ...P, control: 'vf', frequency: 30 });
    expect(vf.phaseVoltage).toBeCloseTo(132.79, 2);
    expect(vf.circuit.xs).toBeCloseTo(0.41, 9);
    expect(vf.circuit.rr).toBe(0.23);
  });

  it('constant-voltage frequency control keeps Vs and raises ωs', () => {
    const sup = acSupply({ ...P, control: 'frequency', frequency: 120 });
    expect(sup.phaseVoltage).toBeCloseTo(265.581, 3);
    expect(sup.omegaSync).toBeCloseTo(376.991, 3);
  });

  it('rotor resistance adds to Rr only in its own mode', () => {
    expect(acSupply({ ...P, externalRotorResistance: 1 }).circuit.rr).toBe(0.23);
    expect(
      acSupply({ ...P, control: 'rotor-resistance', externalRotorResistance: 1 }).circuit.rr,
    ).toBeCloseTo(1.23, 12);
  });
});

describe('physics', () => {
  it('torque is zero at synchronous speed, negative above it (generating), positive below', () => {
    const ws = acSupply(P).omegaSync;
    expect(acTorqueAtSpeed(P, ws)).toBe(0);
    expect(acTorqueAtSpeed(P, ws * 1.02)).toBeLessThan(0);
    expect(acTorqueAtSpeed(P, ws * 0.98)).toBeGreaterThan(0);
    expect(rotorCurrent(100, acSupply(P).circuit, 0)).toBe(0);
    expect(inputImpedance(acSupply(P).circuit, 0)).toEqual({ magnitude: 22, angle: Math.PI / 2 });
  });

  it('plugging (S > 1) still gives braking torque in the course formula', () => {
    const sup = acSupply(P);
    expect(inductionTorque(sup.phaseVoltage, sup.omegaSync, sup.circuit, 1.5)).toBeGreaterThan(0);
  });

  it('the motor cannot start a constant load larger than its starting torque', () => {
    const p: InductionMotorParams = { ...P, loadExponent: 0, loadRatedTorque: 100, friction: 0 };
    const r = new SimulationRunner(inductionMotorModel, p);
    r.runFor(1);
    expect(r.outputs.startingTorque).toBeLessThan(100);
    expect(r.outputs.speed).toBe(0);
  });

  it('power balance: Pin = Pg + stator copper loss; Pg = Pd + rotor copper loss', () => {
    const r = new SimulationRunner(inductionMotorModel, P);
    r.runFor(2);
    const o = r.outputs;
    expect(o.inputPower).toBeCloseTo(o.airGapPower + o.statorCopperLoss, 6);
    expect(o.airGapPower).toBeCloseTo(o.developedPower + o.rotorCopperLoss, 6);
  });

  it('the slip angle advances at ωs − ωm and stays in 0…2π', () => {
    const r = new SimulationRunner(inductionMotorModel, P);
    r.runFor(1);
    for (const s of r.trace()) {
      expect(s.values.slipAngle as number).toBeGreaterThanOrEqual(0);
      expect(s.values.slipAngle as number).toBeLessThan(2 * Math.PI);
    }
    expect(inductionMotorModel.derivatives(0, [100, 0], P)[1]).toBeCloseTo(
      acSupply(P).omegaSync - 100,
      9,
    );
  });

  it('load characteristic adds friction; passive load holds at standstill', () => {
    expect(
      acLoadTorqueAtSpeed({ ...P, loadExponent: 0, loadRatedTorque: 10, friction: 0.01 }, 100),
    ).toBeCloseTo(11, 9);
    expect(passiveLoadTorque(10, 0, 4)).toBe(4);
    expect(passiveLoadTorque(10, -1, 4)).toBe(-10);
  });
});

describe('step-size rule', () => {
  it("uses J/(3Vs²/(ωs²Rr') + B) as the fastest time constant", () => {
    const sup = acSupply(P);
    const slope = (3 * sup.phaseVoltage ** 2) / (sup.omegaSync ** 2 * 0.23);
    expect(inductionMotorModel.fastestTimeConstant(P)).toBeCloseTo(0.1 / (slope + P.friction), 12);
  });
});
