import { describe, expect, it } from 'vitest';
import {
  encoderAngle,
  responseMetrics,
  SERVO_PRESETS,
  servoControl,
  servoMotorModel,
  servoReference,
  SimulationRunner,
  type ServoParams,
} from '@/sim-core';

const P = SERVO_PRESETS.position;
const errors = (p: ServoParams) =>
  servoMotorModel.validate(p).filter((i) => i.severity === 'error');

describe('servo validation', () => {
  it('accepts every preset', () => {
    for (const p of Object.values(SERVO_PRESETS)) expect(errors(p)).toEqual([]);
  });

  it('range messages; whole encoder lines; warnings for an open loop and an unholdable load', () => {
    expect(errors({ ...P, la: 0 })[0]?.message).toMatch(/Armature inductance La/);
    expect(errors({ ...P, encoderLines: 10.5 })[0]?.parameter).toBe('encoderLines');
    expect(errors({ ...P, reference: 'ramp', referenceRate: 1000 })[0]?.parameter).toBe(
      'referenceRate',
    );
    expect(errors({ ...P, reference: 'sine', referenceFrequency: 0 })[0]?.parameter).toBe(
      'referenceFrequency',
    );
    expect(servoMotorModel.validate({ ...P, kp: 0 })).toEqual([
      expect.objectContaining({ severity: 'warning', parameter: 'kp' }),
    ]);
    // stall torque kφ·Vmax/Ra = 1.2 N·m
    expect(servoMotorModel.validate({ ...P, loadTorque: 1.5 })).toEqual([
      expect.objectContaining({ severity: 'warning', parameter: 'loadTorque' }),
    ]);
  });
});

describe('servo control law', () => {
  it('references: step, ramp and sine', () => {
    expect(servoReference(P, 3)).toBeCloseTo(Math.PI / 2, 12);
    expect(servoReference({ ...P, reference: 'ramp', referenceRate: 2 }, 0.5)).toBe(1);
    expect(servoReference({ ...P, reference: 'sine', referenceFrequency: 1 }, 0.25)).toBeCloseTo(
      Math.PI / 2,
      12,
    );
  });

  it('drive signal Ve = Vcs − Vfc; amplifier limited to ±Vmax', () => {
    const c = servoControl(P, 0, [0, 0, 0.5, 0]);
    expect(c.vcs).toBeCloseTo(Math.PI / 2, 12);
    expect(c.vfc).toBe(0.5);
    expect(c.ve).toBeCloseTo(Math.PI / 2 - 0.5, 12);
    expect(c.va).toBeCloseTo(5 * (Math.PI / 2 - 0.5), 12);
    const big = servoControl({ ...P, kp: 100 }, 0, [0, 0, 0, 0]);
    expect(big.va).toBe(24);
    expect(big.saturated).toBe(true);
  });

  it('derivative acts on the measured speed, not the error (no kick at the step)', () => {
    const c = servoControl({ ...P, kd: 0.1 }, 0, [0, 2, 0, 0]);
    expect(c.demand).toBeCloseTo(5 * (Math.PI / 2) - 0.1 * 1 * 2, 12);
  });

  it('encoder feedback quantises the measured angle to one count', () => {
    const enc = { ...P, feedback: 'encoder' as const, encoderLines: 10 };
    const c = servoControl(enc, 0, [0, 0, 0.2, 0]);
    expect(c.vfc).toBeCloseTo(encoderAngle(0.2, 10), 12);
    expect(c.vfc).toBeCloseTo((2 * Math.PI) / 40, 12);
  });

  it('anti-windup: the integral stops while saturated in the same direction', () => {
    const p = { ...P, kp: 100, ki: 50 };
    const d = servoMotorModel.derivatives(0, [0, 0, 0, 0], p);
    expect(d[3]).toBe(0);
    const ok = servoMotorModel.derivatives(0, [0, 0, 1.5, 0], { ...P, ki: 50 });
    expect(ok[3]).toBeCloseTo(Math.PI / 2 - 1.5, 12);
    // Ki = 0: nothing accumulates, so switching Ki on later starts from zero.
    expect(servoMotorModel.derivatives(0, [0, 0, 0, 0], P)[3]).toBe(0);
  });
});

describe('servo model', () => {
  it('position step settles at the reference with no load (type-1 loop)', () => {
    const r = new SimulationRunner(servoMotorModel, P);
    r.runFor(1);
    expect(r.outputs.positionDeg).toBeCloseTo(90, 3);
    expect(r.outputs.errorDeg).toBeCloseTo(0, 3);
    // Approaching 90° from below, the 500-line encoder reads 499 or 500 counts.
    expect([499, 500]).toContain(r.outputs.encoderCount);
    expect(r.outputs.resolverQuadrant).toBe(1);
  });

  it('tracking a ramp leaves a constant following error', () => {
    const p = { ...P, reference: 'ramp' as const, referenceRate: 2 };
    const r = new SimulationRunner(servoMotorModel, p);
    r.runFor(1);
    const e1 = r.outputs.error;
    r.runFor(0.5);
    // Velocity error: e = ω·(B + kφ²/Ra)/K = 2·0.0051/0.25 = 0.0408 rad
    expect(e1).toBeCloseTo(0.0408, 4);
    expect(r.outputs.error).toBeCloseTo(e1, 6);
  });

  it('speed mode reports rpm values and NaN for position-only outputs', () => {
    const r = new SimulationRunner(servoMotorModel, SERVO_PRESETS.speed);
    r.runFor(0.5);
    expect(r.outputs.referenceRpm).toBeCloseTo((100 * 60) / (2 * Math.PI), 9);
    expect(Number.isNaN(r.outputs.referenceDeg)).toBe(true);
    expect(Number.isNaN(r.outputs.errorDeg)).toBe(true);
  });

  it('step size: below a tenth of La/Ra and of the loop time constants', () => {
    expect(servoMotorModel.fastestTimeConstant(P)).toBeCloseTo(1e-3, 12);
    const fast = servoMotorModel.fastestTimeConstant({ ...SERVO_PRESETS.speed, kp: 200 });
    expect(fast).toBeLessThan(1e-3);
  });
});

describe('response metrics edge cases', () => {
  it('NaN for an empty trace or a zero step; NaN settling if still outside the band', () => {
    expect(Number.isNaN(responseMetrics([], 0, 1).riseTime)).toBe(true);
    expect(Number.isNaN(responseMetrics([{ t: 0, y: 0 }], 0, 0).overshoot)).toBe(true);
    const ramp = [0, 0.5, 0.9].map((y, i) => ({ t: i, y }));
    expect(Number.isNaN(responseMetrics(ramp, 0, 1).settlingTime)).toBe(true);
  });

  it('measures overshoot of an underdamped response and handles a negative step', () => {
    const s = [0, 0.6, 1.2, 1.05, 0.99, 1, 1].map((y, i) => ({ t: i * 0.1, y: -y }));
    const m = responseMetrics(s, 0, -1);
    expect(m.overshoot).toBeCloseTo(0.2, 12);
    expect(m.settlingTime).toBeGreaterThan(0.3);
    expect(m.settlingTime).toBeLessThan(0.4);
  });
});
