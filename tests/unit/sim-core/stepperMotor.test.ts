import { describe, expect, it } from 'vitest';
import {
  electricalCycles,
  equilibriumAngle,
  phaseCurrents,
  radToDeg,
  SimulationRunner,
  STEPPER_PRESETS,
  stepperGeometry,
  stepperGeometryIssue,
  stepperMotorModel,
  stepperTorque,
  stepAngleFromSteps,
  type StepperParams,
} from '@/sim-core';

const P = STEPPER_PRESETS.vr64;
const errors = (p: StepperParams) =>
  stepperMotorModel.validate(p).filter((i) => i.severity === 'error');

describe('stepper validation', () => {
  it('accepts every preset', () => {
    for (const p of Object.values(STEPPER_PRESETS)) expect(errors(p)).toEqual([]);
  });

  it('applies the course tooth-count rules to VR motors', () => {
    expect(errors({ ...P, statorTeeth: 4, rotorTeeth: 6 })[0]?.message).toMatch(/negative/);
    expect(errors({ ...P, statorTeeth: 7, rotorTeeth: 4 })[0]?.message).toMatch(/whole number/);
    expect(stepperGeometryIssue(2.5, 2)).toMatch(/whole numbers/);
    // 9/6 gives PPR 18 but m = 3; 24/2 gives m = 24/22: rejected as phase count
    expect(stepperGeometryIssue(9, 6)).toBeNull();
    expect(stepperGeometryIssue(48, 46)).toMatch(/phases/);
  });

  it('two-phase motors need steps per revolution in multiples of 4', () => {
    expect(errors({ ...STEPPER_PRESETS.hybrid, stepsPerRev: 202 })[0]?.message).toMatch(
      /multiple of 4/,
    );
  });

  it('microstepping: two-phase bipolar only, 2/4/8/16', () => {
    expect(errors({ ...P, mode: 'micro' })[0]?.message).toMatch(/two-phase/);
    const h = { ...STEPPER_PRESETS.hybrid, mode: 'micro' as const };
    expect(errors({ ...h, microsteps: 3 })[0]?.message).toMatch(/2, 4, 8 or 16/);
    expect(errors({ ...h, coilDrive: 'unipolar' })[0]?.message).toMatch(/bipolar/);
    expect(errors({ ...h, microsteps: 8 })).toEqual([]);
  });

  it('ranges, whole pulse counts, and a warning when the load exceeds the holding torque', () => {
    expect(errors({ ...P, pulseRate: 0 })[0]?.parameter).toBe('pulseRate');
    expect(errors({ ...P, pulseLimit: 2.5 })[0]?.parameter).toBe('pulseLimit');
    const w = stepperMotorModel.validate({ ...P, rotorDynamics: true, loadTorque: 0.2 });
    expect(w).toEqual([expect.objectContaining({ severity: 'warning', parameter: 'loadTorque' })]);
    // Two-phase normal drive holds √2·Tpk, so the same ratio is still holdable.
    const n = { ...STEPPER_PRESETS.hybrid, rotorDynamics: true, mode: 'normal' as const };
    expect(stepperMotorModel.validate({ ...n, loadTorque: 0.5 })).toEqual([]);
  });
});

describe('stepper equations', () => {
  it('electrical cycles: VR 6/4 → 4, hybrid 1.8° → 50, PM 7.5° → 12', () => {
    expect(electricalCycles('vr', (30 * Math.PI) / 180, 3)).toBeCloseTo(4, 12);
    expect(electricalCycles('hybrid', stepAngleFromSteps(200), 2)).toBeCloseTo(50, 12);
    expect(electricalCycles('pm', stepAngleFromSteps(48), 2)).toBeCloseTo(12, 12);
  });

  it('every step of every mode is a stable detent at its equilibrium angle', () => {
    const cases: [StepperParams['family'], number, number, StepperParams['mode']][] = [
      ['vr', 3, 30, 'wave'],
      ['vr', 3, 30, 'normal'],
      ['vr', 4, 15, 'half'],
      ['hybrid', 2, 1.8, 'wave'],
      ['hybrid', 2, 1.8, 'normal'],
      ['hybrid', 2, 1.8, 'half'],
      ['hybrid', 2, 1.8, 'micro'],
    ];
    for (const [family, m, saDeg, mode] of cases) {
      const sa = (saDeg * Math.PI) / 180;
      const ne = electricalCycles(family, sa, m);
      for (let k = -5; k <= 9; k += 1) {
        const i = phaseCurrents(family, m, mode, k, 8);
        const th = equilibriumAngle(sa, mode, k, 8);
        const h = 1e-7;
        expect(Math.abs(stepperTorque(family, i, th, ne, 1))).toBeLessThan(1e-9);
        expect(stepperTorque(family, i, th + h, ne, 1)).toBeLessThan(0);
        expect(stepperTorque(family, i, th - h, ne, 1)).toBeGreaterThan(0);
      }
    }
  });
});

describe('stepper model, ideal rotor', () => {
  it('sends pulses at PR, moves one step per pulse, and stops at the pulse limit', () => {
    const r = new SimulationRunner(stepperMotorModel, { ...P, pulseLimit: 5 });
    r.runFor(0.101); // pulses at 0.05 and 0.10 s
    expect(r.outputs.pulses).toBe(2);
    expect(r.outputs.rotorAngleDeg).toBeCloseTo(60, 9);
    expect(r.outputs.commandSpeedRpm).toBeCloseTo(100, 9);
    r.runFor(1);
    expect(r.outputs.pulses).toBe(5);
    expect(r.outputs.rotorAngleDeg).toBeCloseTo(150, 9);
    expect(r.outputs.pulsing).toBe(0);
    expect(r.outputs.commandSpeed).toBe(0);
  });

  it('anticlockwise runs the reverse sequence; direction may change during a run', () => {
    const r = new SimulationRunner(stepperMotorModel, { ...P, direction: 'ccw' });
    r.runFor(0.151);
    expect(r.outputs.stepIndex).toBe(-3);
    expect(r.outputs.rotorAngleDeg).toBeCloseTo(-90, 9);
    expect(r.outputs.commandSpeedRpm).toBeCloseTo(-100, 9);
    r.start();
    r.setParams({ ...P, direction: 'cw' });
    r.runFor(0.1);
    expect(r.outputs.stepIndex).toBe(-1);
  });

  it('half step halves Sa and the speed; normal mode starts midway (15°)', () => {
    const half = stepperMotorModel.outputs(0, stepperMotorModel.init({ ...P, mode: 'half' }), {
      ...P,
      mode: 'half',
    });
    expect(radToDeg(half.stepAngle)).toBeCloseTo(15, 12);
    expect(half.ppr).toBeCloseTo(24, 12);
    expect(half.commandSpeedRpm).toBeCloseTo(50, 12);
    const normal = { ...P, mode: 'normal' as const };
    const o = stepperMotorModel.outputs(0, stepperMotorModel.init(normal), normal);
    expect(o.rotorAngleDeg).toBeCloseTo(15, 12);
    expect([o.i0, o.i1, o.i2]).toEqual([1, 1, 0]);
  });

  it('step size: one tenth of the pulse period (ideal); also below 1/ωn with dynamics', () => {
    expect(stepperMotorModel.fastestTimeConstant(P)).toBeCloseTo(0.05, 12);
    const tau = stepperMotorModel.fastestTimeConstant({ ...P, rotorDynamics: true });
    const wn = Math.sqrt((4 * Math.SQRT2 * 0.2) / 2e-5);
    expect(tau).toBeCloseTo(1 / wn, 12);
    expect(stepperGeometry(STEPPER_PRESETS.hybrid).ne).toBeCloseTo(50, 12);
  });
});

describe('stepper model, rotor dynamics (extension)', () => {
  const dyn: StepperParams = { ...STEPPER_PRESETS.hybrid, rotorDynamics: true };

  it('follows a moderate pulse rate with a small lag and no lost steps', () => {
    const r = new SimulationRunner(stepperMotorModel, { ...dyn, pulseRate: 200 });
    r.runFor(0.5);
    expect(r.outputs.lostSteps).toBe(0);
    // Just after a pulse the lag can exceed one step, but stays inside the ±2-step stable region.
    expect(Math.abs(r.outputs.positionErrorDeg)).toBeLessThan(3.6);
  });

  it('loses steps when started too fast against a load (pull-in exceeded)', () => {
    const r = new SimulationRunner(stepperMotorModel, {
      ...dyn,
      pulseRate: 5000,
      loadTorque: 0.2,
    });
    r.runFor(0.3);
    expect(r.outputs.lostSteps).toBeGreaterThan(0);
  });
});
