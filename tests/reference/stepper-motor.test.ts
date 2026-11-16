/**
 * RC-M04-01 to RC-M04-06. Literals from docs/reference-cases/stepper-motor.md.
 */
import { describe, expect, it } from 'vitest';
import {
  degToRad,
  hybridRotorTeeth,
  hybridStepAngle,
  hybridStepsPerRev,
  phaseCurrents,
  pulseRateForSpeed,
  pulsesForAngle,
  pulsesPerRevolution,
  radToDeg,
  rpmToRadPerSec,
  SimulationRunner,
  STEPPER_PRESETS,
  stepAngleFromSteps,
  stepAngleFromTeeth,
  stepperGeometryIssue,
  stepperMotorModel,
  stepperSequenceTable,
  stepperSpeed,
  stepperTorque,
  stepTime,
  vrPhaseCount,
  type StepperParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-9) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);
const rpm = (omega: number) => (omega * 60) / (2 * Math.PI);

describe('RC-M04-01 step angle and speed (LN Ch2 Part I, Tutorial 3)', () => {
  it.each([
    [6, 4, 30, 3, 12],
    [12, 8, 15, 3, 24],
    [8, 6, 15, 4, 24],
  ])('VR %i/%i: Sa %i°, m %i, PPR %i', (ns, nr, sa, m, ppr) => {
    rel(radToDeg(stepAngleFromTeeth(ns, nr)), sa);
    rel(vrPhaseCount(ns, nr), m);
    rel(pulsesPerRevolution(stepAngleFromTeeth(ns, nr)), ppr);
    expect(stepperGeometryIssue(ns, nr)).toBeNull();
  });

  it('Sa 15° at 300 pulses/s: 750 rpm; Sa 10° at 200 rpm: 120 pulses/s', () => {
    rel(rpm(stepperSpeed(degToRad(15), 300)), 750);
    rel(pulseRateForSpeed(degToRad(10), rpmToRadPerSec(200)), 120);
  });

  it('VR 6/4 at 100 rpm: 20 pulses/s and 0.05 s per step', () => {
    const pr = pulseRateForSpeed(stepAngleFromTeeth(6, 4), rpmToRadPerSec(100));
    rel(pr, 20);
    rel(stepTime(pr), 0.05);
  });

  it('rejects VR 4/6 (negative step angle) and VR 7/4 (PPR 9.333 not an integer)', () => {
    expect(stepperGeometryIssue(4, 6)).toMatch(/negative step angle/);
    expect(stepperGeometryIssue(7, 4)).toMatch(/9\.333 is not a whole number/);
    expect(stepperGeometryIssue(6, 6)).toMatch(/Sa = 0/);
  });
});

describe('RC-M04-02 pulses, speed and half step (course MCQ stepper set)', () => {
  const sa = stepAngleFromSteps(200);
  it('1.8° at 500 pulses/s: 150 rpm; half step: 75 rpm', () => {
    rel(rpm(stepperSpeed(sa, 500)), 150);
    rel(rpm(stepperSpeed(sa / 2, 500)), 75);
  });
  it('90°: 50 pulses (200 PPR), 100 pulses (400 PPR); 1000 pulses: 1800°, 900°', () => {
    rel(pulsesForAngle(degToRad(90), sa), 50);
    rel(pulsesForAngle(degToRad(90), sa / 2), 100);
    rel(radToDeg(1000 * sa), 1800);
    rel(radToDeg(1000 * (sa / 2)), 900);
  });
  it('7.5° (48 PPR) at 1000 pulses/s: 1250 rpm', () => {
    rel(rpm(stepperSpeed(stepAngleFromSteps(48), 1000)), 1250);
  });
});

describe('RC-M04-03 phase sequence tables, 3-phase 6/4 VR', () => {
  const p = (mode: StepperParams['mode'], direction: StepperParams['direction'] = 'cw') => ({
    ...STEPPER_PRESETS.vr64,
    mode,
    direction,
  });
  const names = (i: readonly number[]) => i.map((v, j) => (v ? 'ABC'[j] : '')).join('') || '-';
  const rows = (pp: StepperParams, n: number) =>
    stepperSequenceTable(pp, n).map((r) => [names(r.currents), Math.round(radToDeg(r.angle))]);

  it('wave: A 0°, B 30°, C 60°, A 90° … A 180°', () => {
    expect(rows(p('wave'), 7)).toEqual([
      ['A', 0],
      ['B', 30],
      ['C', 60],
      ['A', 90],
      ['B', 120],
      ['C', 150],
      ['A', 180],
    ]);
  });
  it('normal: AB 15°, BC 45°, CA 75°, AB 105°', () => {
    expect(rows(p('normal'), 4)).toEqual([
      ['AB', 15],
      ['BC', 45],
      ['AC', 75],
      ['AB', 105],
    ]);
  });
  it('half step: A 0°, AB 15°, B 30°, BC 45°, C 60°, CA 75°, A 90°', () => {
    expect(rows(p('half'), 7)).toEqual([
      ['A', 0],
      ['AB', 15],
      ['B', 30],
      ['BC', 45],
      ['C', 60],
      ['AC', 75],
      ['A', 90],
    ]);
  });
  it('anticlockwise wave: A 0°, C −30°, B −60°, A −90°', () => {
    expect(rows(p('wave', 'ccw'), 4)).toEqual([
      ['A', 0],
      ['C', -30],
      ['B', -60],
      ['A', -90],
    ]);
  });
  it('two-phase bipolar: wave A+ B+ A− B−; normal A+B+ A−B+ A−B− A+B−; half step 8 states', () => {
    const seq = (mode: StepperParams['mode'], n: number) =>
      Array.from({ length: n }, (_, k) => phaseCurrents('hybrid', 2, mode, k));
    expect(seq('wave', 4)).toEqual([
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]);
    expect(seq('normal', 4)).toEqual([
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ]);
    expect(seq('half', 8)).toEqual([
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ]);
  });
});

describe('RC-M04-04 rotor dynamics, VR 6/4 (VADL model)', () => {
  const dyn: StepperParams = { ...STEPPER_PRESETS.vr64, rotorDynamics: true };

  it('stiffness −0.8 N·m/rad at equilibrium (Ne·Tpk)', () => {
    const h = 1e-6;
    const k =
      (stepperTorque('vr', [1, 0, 0], h, 4, 0.2) - stepperTorque('vr', [1, 0, 0], -h, 4, 0.2)) /
      (2 * h);
    rel(k, -0.8, 1e-6);
  });

  it('a rotor at rest against 0.1 N·m sits at the load angle, −7.5°', () => {
    const r = new SimulationRunner(stepperMotorModel, { ...dyn, pulseLimit: 1, loadTorque: 0.1 });
    expect(Math.abs(radToDeg(r.state[3] as number) + 7.5)).toBeLessThan(1e-9);
    r.runFor(0.04); // before the first pulse at 0.05 s
    expect(Math.abs(radToDeg(r.state[3] as number) + 7.5)).toBeLessThan(0.05);
  });

  it('one wave step settles at 30° with no load and 26.3806° against 0.05 N·m', () => {
    for (const [load, expected] of [
      [0, 30],
      [0.05, 26.3806],
    ] as const) {
      const r = new SimulationRunner(stepperMotorModel, {
        ...dyn,
        pulseLimit: 1,
        loadTorque: load,
      });
      r.runFor(1.5);
      expect(Math.abs(radToDeg(r.state[3] as number) - expected)).toBeLessThan(0.05);
    }
  });
});

describe('RC-M04-05 microstepping (extension)', () => {
  const p: StepperParams = {
    ...STEPPER_PRESETS.hybrid,
    mode: 'micro',
    microsteps: 16,
    pulseRate: 3200,
  };
  it('1/16 of 1.8°: 0.1125° per pulse, 3200 pulses/rev, 60 rpm at 3200 pulses/s', () => {
    const out = stepperMotorModel.outputs(0, stepperMotorModel.init(p), p);
    rel(radToDeg(out.stepAngle), 0.1125);
    rel(out.ppr, 3200);
    rel(out.commandSpeedRpm, 60);
  });
  it('coil currents at microstep 4: iA 0.92388, iB 0.38268', () => {
    const [ia, ib] = phaseCurrents('hybrid', 2, 'micro', 4, 16);
    rel(ia as number, 0.92388, 1e-5);
    rel(ib as number, 0.38268, 1e-5);
  });
});

describe('RC-M04-06 two-phase hybrid step angle from rotor teeth (Milestone 11)', () => {
  it('Nr 50 → 1.8° and 200 steps/rev; Nr 100 → 0.9° and 400 steps/rev', () => {
    expect(radToDeg(hybridStepAngle(50))).toBeCloseTo(1.8, 9);
    expect(hybridStepsPerRev(50)).toBe(200);
    expect(radToDeg(hybridStepAngle(100))).toBeCloseTo(0.9, 9);
    expect(hybridStepsPerRev(100)).toBe(400);
  });
  it('a 200 steps/rev hybrid has 50 rotor teeth; the model reports it', () => {
    expect(hybridRotorTeeth(200)).toBe(50);
    const o = stepperMotorModel.outputs(
      0,
      stepperMotorModel.init(STEPPER_PRESETS.hybrid),
      STEPPER_PRESETS.hybrid,
    );
    expect(o.hybridRotorTeeth).toBe(50);
    expect(radToDeg(o.fullStepAngle)).toBeCloseTo(1.8, 9);
    const vr = stepperMotorModel.outputs(
      0,
      stepperMotorModel.init(STEPPER_PRESETS.vr64),
      STEPPER_PRESETS.vr64,
    );
    expect(Number.isNaN(vr.hybridRotorTeeth)).toBe(true);
  });
  it('the VR formula does not apply: 8 poles and 50 teeth would give 37.8°', () => {
    expect(Math.abs(radToDeg(stepAngleFromTeeth(8, 50)))).toBeCloseTo(37.8, 9);
  });
});
