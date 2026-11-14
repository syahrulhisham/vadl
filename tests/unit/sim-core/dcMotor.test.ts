import { describe, expect, it } from 'vitest';
import {
  canReverseCurrent,
  canReverseVoltage,
  CONVERTER_KINDS,
  DC_PRESETS,
  dcArmatureVoltage,
  dcFieldVoltage,
  dcLoadTorqueAtSpeed,
  dcMotorModel,
  dcSteadySpeedAtTorque,
  degToRad,
  isThreePhase,
  isUnidirectional,
  loadTorque,
  MIN_SPEED_RATIO,
  SimulationRunner,
  type DcMotorParams,
} from '@/sim-core';

const SE = DC_PRESETS.separatelyExcited;

describe('validation (FR-05)', () => {
  it('accepts every preset', () => {
    for (const p of Object.values(DC_PRESETS)) {
      expect(dcMotorModel.validate(p).filter((i) => i.severity === 'error')).toEqual([]);
    }
  });

  it('rejects out-of-range values with the range in the message', () => {
    const issues = dcMotorModel.validate({ ...SE, ra: 0, armatureVoltage: 1000, inertia: 0 });
    expect(issues.map((i) => i.parameter).sort()).toEqual(['armatureVoltage', 'inertia', 'ra']);
    expect(issues.find((i) => i.parameter === 'ra')?.message).toBe(
      'Armature resistance must be between 0.01 and 20 Ω.',
    );
  });

  it('reports firing angles in degrees', () => {
    const p: DcMotorParams = { ...DC_PRESETS.converterFed, alphaArmature: degToRad(200) };
    expect(dcMotorModel.validate(p)[0]?.message).toBe(
      'Armature firing angle must be between 0 and 180 °.',
    );
  });

  it('refuses a zero field current for separately excited and shunt motors, explaining why', () => {
    const issues = dcMotorModel.validate({ ...SE, fieldVoltage: 0 });
    expect(issues[0]?.parameter).toBe('fieldVoltage');
    expect(issues[0]?.message).toMatch(/no torque/);
    expect(dcMotorModel.validate({ ...DC_PRESETS.shunt, armatureVoltage: -10 })[0]?.parameter).toBe(
      'armatureVoltage',
    );
  });

  it('warns, but allows, a series motor with almost no load', () => {
    const issues = dcMotorModel.validate({ ...DC_PRESETS.series, loadRatedTorque: 0.5 });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe('warning');
    expect(issues[0]?.message).toMatch(/speed rises without limit/);
  });

  it('rejects a load exponent outside the course families', () => {
    const issues = dcMotorModel.validate({ ...SE, loadExponent: 3 as unknown as 0 });
    expect(issues[0]?.parameter).toBe('loadExponent');
  });
});

describe('supply and field', () => {
  it('uses the DC supply directly, or the converter average', () => {
    expect(dcArmatureVoltage(SE)).toBe(220);
    expect(dcArmatureVoltage(DC_PRESETS.converterFed)).toBeCloseTo(198.0696, 3);
  });

  it('feeds the shunt field from the armature voltage and the series field from Ia', () => {
    expect(dcFieldVoltage(DC_PRESETS.shunt, 180)).toBe(180);
    expect(dcFieldVoltage(DC_PRESETS.series, 220)).toBe(0);
    const out = dcMotorModel.outputs(0, [12, 0], DC_PRESETS.series);
    expect(out.fieldCurrent).toBe(12);
  });

  it('classifies converters', () => {
    expect(CONVERTER_KINDS).toHaveLength(8);
    expect(CONVERTER_KINDS.filter(canReverseCurrent)).toEqual(['single-dual', 'three-dual']);
    expect(canReverseVoltage('single-semi')).toBe(false);
    expect(canReverseVoltage('single-full')).toBe(true);
    expect(isThreePhase('three-semi')).toBe(true);
    expect(isUnidirectional(SE)).toBe(false);
    expect(isUnidirectional(DC_PRESETS.converterFed)).toBe(true);
    expect(isUnidirectional({ ...DC_PRESETS.converterFed, armatureConverter: 'single-dual' })).toBe(
      false,
    );
  });
});

describe('physical behaviour', () => {
  it('a single-quadrant converter never carries negative armature current', () => {
    // Inverting at α = 150° with the rotor already turning: current would reverse.
    const p: DcMotorParams = {
      ...DC_PRESETS.converterFed,
      alphaArmature: degToRad(150),
      loadRatedTorque: 0,
    };
    const r = new SimulationRunner(dcMotorModel, p);
    // Start from a spinning rotor by projecting an initial state through the model.
    expect(dcMotorModel.project?.([-5, 50], p)).toEqual([0, 50]);
    r.runFor(0.5);
    for (const s of r.trace()) expect(s.values.armatureCurrent as number).toBeGreaterThanOrEqual(0);
    expect(dcMotorModel.outputs(0, [0, 50], p).conductionBlocked).toBe(1);
  });

  it('a dual converter allows reverse current (regeneration)', () => {
    const p: DcMotorParams = { ...DC_PRESETS.converterFed, armatureConverter: 'single-dual' };
    expect(dcMotorModel.project?.([-5, 50], p)).toEqual([-5, 50]);
  });

  it('a passive load holds the shaft at standstill when the motor torque is too small', () => {
    const p: DcMotorParams = { ...SE, armatureVoltage: 5 }; // Ia ≤ 10 A → Td ≤ 12 N·m < 24 N·m
    const r = new SimulationRunner(dcMotorModel, p);
    r.runFor(0.5);
    expect(r.outputs.speed).toBe(0);
    expect(r.outputs.armatureCurrent).toBeCloseTo(10, 6);
  });

  it('reverses with a negative DC armature voltage and the load still opposes motion', () => {
    const r = new SimulationRunner(dcMotorModel, { ...SE, armatureVoltage: -220 });
    r.runFor(3);
    expect(r.outputs.speed).toBeCloseTo(-175, 2);
    expect(r.outputs.loadTorque).toBeCloseTo(-24, 6);
  });

  it('load law stays finite at standstill for constant-power loads (k = −1)', () => {
    expect(MIN_SPEED_RATIO).toBe(0.01);
    expect(loadTorque(1, 24, 0, 1500, -1)).toBeCloseTo(2400, 9);
    expect(loadTorque(1, 24, -1000, 1500, 2)).toBeCloseTo(10.6667, 4);
  });

  it('reports zero efficiency when no output power is delivered', () => {
    expect(dcMotorModel.outputs(0, [0, 0], SE).efficiency).toBe(0);
  });
});

describe('step-size rule', () => {
  it('the fastest time constant is the smallest of La/R, J·R/K² and J/B', () => {
    // τe = 0.01/0.5 = 0.02 s; τm = 0.2·0.5/1.2² = 0.069444 s
    expect(dcMotorModel.fastestTimeConstant(SE)).toBeCloseTo(0.02, 12);
    const heavyField = { ...SE, inertia: 0.01 }; // τm = 0.003472 s
    expect(dcMotorModel.fastestTimeConstant(heavyField)).toBeCloseTo(0.0034722, 6);
    expect(dcMotorModel.fastestTimeConstant({ ...SE, friction: 1, inertia: 0.01 })).toBeCloseTo(
      0.0034722,
      6,
    );
    expect(dcMotorModel.fastestTimeConstant({ ...SE, la: 1, friction: 0.5 })).toBeCloseTo(
      0.069444,
      5,
    );
  });

  it('includes the series field and starting resistance in τe', () => {
    // series: (La + Ls)/(Ra + Rs + Rst) = 0.015/0.5 = 0.03 s; τm with Ia,max = 440 A is smaller
    const p = DC_PRESETS.series;
    const tauM = (0.2 * 0.5) / (0.04 * 440) ** 2;
    expect(dcMotorModel.fastestTimeConstant(p)).toBeCloseTo(tauM, 9);
  });
});

describe('torque–speed characteristic functions', () => {
  it('the motor curve crosses the load line at the RC-M01-01 steady state (24 N·m, 175 rad/s)', () => {
    expect(dcSteadySpeedAtTorque(SE, 24)).toBeCloseTo(175, 9);
    expect(dcLoadTorqueAtSpeed(SE, 175)).toBeCloseTo(24, 12);
  });

  it('no-load speed is Va/K = 183.333 rad/s; friction adds B·ω to the load side', () => {
    expect(dcSteadySpeedAtTorque(SE, 0)).toBeCloseTo(183.3333, 4);
    expect(dcLoadTorqueAtSpeed({ ...SE, friction: 0.01 }, 100)).toBeCloseTo(25, 12);
  });

  it('series curve: 40 N·m gives 161.425 rad/s (RC-M01-05); undefined at zero torque', () => {
    expect(dcSteadySpeedAtTorque(DC_PRESETS.series, 40)).toBeCloseTo(161.425, 3);
    expect(dcSteadySpeedAtTorque(DC_PRESETS.series, 0)).toBeNaN();
  });
});
