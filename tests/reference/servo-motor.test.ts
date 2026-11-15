/**
 * RC-M05-01 to RC-M05-05. Literals from docs/reference-cases/servo-motor.md.
 */
import { describe, expect, it } from 'vitest';
import {
  degToRad,
  encoderChannels,
  encoderCount,
  encoderResolution,
  positionServoLoadError,
  positionServoSecondOrder,
  radToDeg,
  resolverAngle,
  resolverOutputs,
  resolverQuadrant,
  responseMetrics,
  servoMotorModel,
  SERVO_PRESETS,
  SimulationRunner,
  speedServoSteadyState,
  type ServoParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol: number) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);

describe('RC-M05-01 encoder and resolver (LN Ch2 Part II)', () => {
  it('2¾ lines → 11 quadrature counts', () => {
    expect(encoderCount(2.75 * ((2 * Math.PI) / 4), 4)).toBe(11);
    expect(encoderCount((2.75 / 500) * 2 * Math.PI, 500)).toBe(11);
  });
  it('500 lines: 2000 counts per revolution, 500 counts at 90°, 0.18° per count', () => {
    expect(encoderCount(2 * Math.PI, 500)).toBe(2000);
    expect(encoderCount(degToRad(90), 500)).toBe(500);
    rel(radToDeg(encoderResolution(500)), 0.18, 1e-9);
  });
  it('A leads B clockwise; Z once per revolution', () => {
    const lines = 1;
    // Clockwise from 0: A rises at 0, B rises a quarter period later.
    expect(encoderChannels(degToRad(10), lines)).toMatchObject({ a: 1, b: 0 });
    expect(encoderChannels(degToRad(100), lines)).toMatchObject({ a: 1, b: 1 });
    expect(encoderChannels(degToRad(200), lines)).toMatchObject({ a: 0, b: 1 });
    expect(encoderChannels(degToRad(10), 100).z).toBe(0);
    expect(encoderChannels(degToRad(0.5), 100).z).toBe(1);
  });
  it('resolver at 210°: Vsin −0.5, Vcos −0.866025, third quadrant, atan2 → 210°', () => {
    const r = resolverOutputs(degToRad(210), 1);
    rel(r.sin, -0.5, 1e-6);
    rel(r.cos, -0.866025, 1e-6);
    expect(resolverQuadrant(r.sin, r.cos)).toBe(3);
    rel(radToDeg(resolverAngle(r.sin, r.cos)), 210, 1e-9);
  });
});

describe('RC-M05-02 position servo holding a load', () => {
  it('formula: e = TL·Ra/(Kp·Kfb·kφ) = 0.2 rad', () => {
    rel(positionServoLoadError(0.05, 2, 5, 1, 0.1), 0.2, 1e-9);
  });
  it('model settles with Ia 0.5 A, Va 1 V and a 0.2 rad error; integral action removes it', () => {
    const r = new SimulationRunner(servoMotorModel, SERVO_PRESETS.positionLoad);
    r.runFor(1.5);
    rel(r.outputs.error, 0.2, 1e-4);
    rel(r.outputs.armatureCurrent, 0.5, 1e-4);
    rel(r.outputs.armatureVoltage, 1, 1e-4);
    const pi = new SimulationRunner(servoMotorModel, SERVO_PRESETS.positionPi);
    pi.runFor(4);
    expect(Math.abs(pi.outputs.error)).toBeLessThan(1e-4);
  });
});

describe('RC-M05-03 position servo step response', () => {
  it('second-order formulas: K 0.25, ωn 50 rad/s, ζ 0.51, Mp 15.526 %, tp 0.073045 s', () => {
    const s = positionServoSecondOrder(5, 1, 0.1, 2, 1e-4, 1e-4);
    rel(s.stiffness, 0.25, 1e-9);
    rel(s.naturalFrequency, 50, 1e-9);
    rel(s.dampingRatio, 0.51, 1e-9);
    rel(s.overshoot, 0.15526, 1e-4);
    rel(s.peakTime, 0.073045, 1e-5);
  });
  it('model with La = 0.05 mH reproduces Mp and tp within 0.5 %', () => {
    const p: ServoParams = { ...SERVO_PRESETS.position, referenceValue: 1, la: 5e-5 };
    const r = new SimulationRunner(servoMotorModel, p, {
      recordInterval: 1e-4,
      recorderCapacity: 10_000,
    });
    r.runFor(0.4);
    const trace = r.trace();
    const peak = trace.reduce((a, b) =>
      (b.values.position ?? 0) > (a.values.position ?? 0) ? b : a,
    );
    rel((peak.values.position as number) - 1, 0.15526, 0.005);
    rel(peak.t, 0.073045, 0.005);
  });
});

describe('RC-M05-04 speed servo', () => {
  it('formula: 90.7441 rad/s with Kp 20, Kt 0.05, Vcs 5 V', () => {
    rel(speedServoSteadyState(5, 20, 0.05, 2, 0.1, 1e-4, 0), 90.7441, 1e-6);
  });
  it('model: saturates at 24 V at the start, then settles at 90.7441 rad/s with Va 9.2559 V', () => {
    const r = new SimulationRunner(servoMotorModel, SERVO_PRESETS.speed);
    r.runFor(0.001);
    expect(r.outputs.saturated).toBe(1);
    expect(r.outputs.armatureVoltage).toBe(24);
    r.runFor(1);
    rel(r.outputs.speed, 90.7441, 1e-4);
    rel(r.outputs.armatureVoltage, 9.2559, 1e-4);
    rel(r.outputs.error, 9.2559, 1e-4);
  });
});

describe('RC-M05-05 response metrics from samples', () => {
  it('first order τ = 0.1 s: rise 0.21972 s, no overshoot, settling 0.39120 s', () => {
    const samples = Array.from({ length: 1001 }, (_, i) => {
      const t = i * 0.001;
      return { t, y: 1 - Math.exp(-t / 0.1) };
    });
    const m = responseMetrics(samples, 0, 1);
    expect(Math.abs(m.riseTime - 0.21972)).toBeLessThan(0.001);
    expect(m.overshoot).toBe(0);
    expect(Math.abs(m.settlingTime - 0.3912)).toBeLessThan(0.001);
    expect(Math.abs(m.steadyStateError)).toBeLessThan(1e-4);
  });
});
