/**
 * RC-M05-06 to RC-M05-08 (Milestone 11). Literals from
 * docs/reference-cases/servo-motor.md.
 */
import { describe, expect, it } from 'vitest';
import {
  acPositionServoSecondOrder,
  acServoConstants,
  acServoTorque,
  encoderAngleDecoded,
  encoderCountDecoded,
  encoderResolutionDecoded,
  radToDeg,
  resolverDigitalAngle,
  resolverDigitalCount,
  resolverDigitalResolution,
  servoMotorModel,
  SERVO_PRESETS,
  SimulationRunner,
  type ServoParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol: number) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);

describe('RC-M05-06 encoder decoding X1, X2, X4 (500 lines, 1 rad)', () => {
  it('counts 79, 159 and 318', () => {
    expect(encoderCountDecoded(1, 500, 1)).toBe(79);
    expect(encoderCountDecoded(1, 500, 2)).toBe(159);
    expect(encoderCountDecoded(1, 500, 4)).toBe(318);
  });
  it('resolutions 0.72°, 0.36° and 0.18° per count', () => {
    rel(radToDeg(encoderResolutionDecoded(500, 1)), 0.72, 1e-9);
    rel(radToDeg(encoderResolutionDecoded(500, 2)), 0.36, 1e-9);
    rel(radToDeg(encoderResolutionDecoded(500, 4)), 0.18, 1e-9);
  });
  it('reported angles 56.88°, 57.24° and 57.24°', () => {
    rel(radToDeg(encoderAngleDecoded(1, 500, 1)), 56.88, 1e-9);
    rel(radToDeg(encoderAngleDecoded(1, 500, 2)), 57.24, 1e-9);
    rel(radToDeg(encoderAngleDecoded(1, 500, 4)), 57.24, 1e-9);
  });
});

describe('RC-M05-07 resolver-to-digital converter (1 rad)', () => {
  it('12 bits: count 651, 0.087890625° per count, 57.216797°', () => {
    expect(resolverDigitalCount(1, 12)).toBe(651);
    rel(radToDeg(resolverDigitalResolution(12)), 0.087890625, 1e-9);
    rel(radToDeg(resolverDigitalAngle(1, 12)), 57.216797, 1e-7);
  });
  it('14 bits: count 2607, 0.02197266° per count, 57.28271°', () => {
    expect(resolverDigitalCount(1, 14)).toBe(2607);
    rel(radToDeg(resolverDigitalResolution(14)), 0.02197266, 1e-6);
    rel(radToDeg(resolverDigitalAngle(1, 14)), 57.28271, 1e-6);
  });
});

describe('RC-M05-08 AC two-phase servo motor (extension)', () => {
  it('Kc = 0.005 N·m/V and Kω = 4e−4 N·m·s/rad', () => {
    const k = acServoConstants(0.12, 24, 300);
    rel(k.torquePerVolt, 0.005, 1e-9);
    rel(k.damping, 4e-4, 1e-9);
    rel(acServoTorque(24, 0, 0.12, 24, 300), 0.12, 1e-9);
    expect(Math.abs(acServoTorque(24, 300, 0.12, 24, 300))).toBeLessThan(1e-12);
  });
  it('position servo: K 0.025 N·m/rad, ωn 15.8114 rad/s, ζ 0.158114', () => {
    const s = acPositionServoSecondOrder(5, 1, 0.12, 24, 300, 1e-4, 1e-4);
    rel(s.stiffness, 0.025, 1e-9);
    rel(s.naturalFrequency, 15.8114, 1e-5);
    rel(s.dampingRatio, 0.158114, 1e-5);
  });
  it('model: holding 0.01 N·m leaves a 0.4 rad error with Vc = 2 V, in phase, no armature current', () => {
    const p: ServoParams = { ...SERVO_PRESETS.acPosition, loadTorque: 0.01 };
    const r = new SimulationRunner(servoMotorModel, p);
    r.runFor(6);
    const o = r.outputs;
    rel(o.error, 0.4, 1e-4);
    rel(o.armatureVoltage, 2, 1e-4);
    expect(o.controlPhaseDeg).toBe(0);
    expect(Number.isNaN(o.armatureCurrent)).toBe(true);
    rel(o.torque, 0.01, 1e-3);
  });
  it('model: speed servo settles at 90.9091 rad/s with Vc = 9.0909 V', () => {
    const p: ServoParams = { ...SERVO_PRESETS.speed, motor: 'ac' };
    const r = new SimulationRunner(servoMotorModel, p);
    r.runFor(3);
    const o = r.outputs;
    rel(o.speed, 90.9091, 1e-4);
    rel(o.armatureVoltage, 9.0909, 1e-4);
  });
  it('a negative command reverses the control phase to 180°', () => {
    const p: ServoParams = { ...SERVO_PRESETS.acPosition, referenceValue: -Math.PI / 2 };
    const r = new SimulationRunner(servoMotorModel, p);
    r.runFor(0.01);
    expect(r.outputs.controlPhaseDeg).toBe(180);
  });
});

describe('sensor options in the loop (Milestone 11)', () => {
  it('X1 decoding of a coarse encoder leaves a larger position error band than X4', () => {
    const settle = (decoding: 1 | 4) => {
      const p: ServoParams = {
        ...SERVO_PRESETS.position,
        feedback: 'encoder',
        encoderLines: 20,
        encoderDecoding: decoding,
        referenceValue: 1,
      };
      const r = new SimulationRunner(servoMotorModel, p);
      r.runFor(3);
      return r.outputs;
    };
    // X1: 18° per count; X4: 4.5° per count. The resting error is below one count.
    expect(Math.abs(settle(1).errorDeg)).toBeLessThanOrEqual(18);
    expect(Math.abs(settle(4).errorDeg)).toBeLessThanOrEqual(4.5);
    rel(settle(1).encoderResolutionDeg, 18, 1e-9);
    rel(settle(4).encoderResolutionDeg, 4.5, 1e-9);
  });
  it('resolver feedback, 12 bits: the measured position is a whole number of counts', () => {
    const p: ServoParams = { ...SERVO_PRESETS.position, feedback: 'resolver', resolverBits: 12 };
    const r = new SimulationRunner(servoMotorModel, p);
    r.runFor(2);
    const o = r.outputs;
    rel(o.resolverResolutionDeg, 0.087890625, 1e-9);
    expect(Math.abs(o.measuredDeg - o.resolverCount * 0.087890625)).toBeLessThan(1e-9);
    expect(Math.abs(o.errorDeg)).toBeLessThan(0.2);
  });
});
