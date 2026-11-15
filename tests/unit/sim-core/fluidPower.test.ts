import { describe, expect, it } from 'vitest';
import {
  airMassFlow,
  ATMOSPHERE,
  electroPneumaticsModel,
  ELECTRO_PNEUMATIC_PRESETS,
  evaluateLadder,
  hydraulicsModel,
  HYDRAULIC_PRESETS,
  hydraulicStroke,
  memoryValve,
  NC,
  NO,
  oilPressureDrop,
  pneumaticSignals,
  pneumaticsModel,
  PNEUMATIC_PRESETS,
  seriesArea,
  SimulationRunner,
  springStroke,
  type ElectroPneumaticsParams,
  type HydraulicsParams,
  type PneumaticsParams,
} from '@/sim-core';

const OFF = { S1: false, S2: false, S3: false };
const NOSENSE = { '1B1': false, '1B2': false, '2B1': false, '2B2': false };
const NORELAY = { K1: false, K2: false, K3: false };

describe('fluid-power helpers', () => {
  it('orifice flow: zero without a pressure drop; choked flow grows linearly with upstream pressure', () => {
    expect(airMassFlow(1e-6, ATMOSPHERE, ATMOSPHERE)).toBe(0);
    const a = airMassFlow(1e-6, 6e5, ATMOSPHERE);
    const b = airMassFlow(1e-6, 12e5, ATMOSPHERE);
    expect(b / a).toBeCloseTo(2, 9);
    expect(seriesArea(1e-6, 0)).toBe(0);
    expect(oilPressureDrop(0, 1)).toBe(Number.POSITIVE_INFINITY);
    expect(oilPressureDrop(1e-6, 0)).toBe(0);
  });

  it('spring return stalls when friction and load exceed the spring', () => {
    expect(springStroke(3e-4, 13.6, 1.36, 20, 1e-6).speed).toBe(0);
    expect(springStroke(3e-4, 13.6, 1.36, 0, 1e-6).speed).toBeGreaterThan(0);
  });

  it('hydraulic stroke: dead-head pressure equals the relief setting; an overrunning load can cavitate', () => {
    const base = {
      pumpFlow: 2 / 60000,
      reliefSetting: 5e6,
      reliefRatedFlow: 2 / 60000,
      inArea: 2e-4,
      outArea: 1.2e-4,
      inPathArea: 3e-6,
      outPathArea: 3e-6,
      checkValve: 0,
    };
    const stall = hydraulicStroke({ ...base, opposingForce: 1e12 });
    expect(stall.speed).toBe(0);
    expect(stall.pumpPressure).toBeCloseTo(5e6, -2);
    const run = hydraulicStroke({ ...base, opposingForce: -2000, outPathArea: 3e-5 });
    expect(run.cavitation).toBe(true);
    const off = hydraulicStroke({ ...base, pumpFlow: 0, opposingForce: 100 });
    expect(off.speed).toBe(0);
  });
});

describe('pneumatic logic (Lab 2)', () => {
  const i = (s1: boolean, s2: boolean, selector = false) => ({ s1, s2, selector });
  it('OR passes either button; AND needs the button and the roller valve', () => {
    expect(pneumaticSignals('or', i(false, true), true, false).drive).toBe(true);
    expect(pneumaticSignals('and-memory', i(true, false), false, false).set).toBe(false);
    expect(pneumaticSignals('and-memory', i(true, false), true, false).set).toBe(true);
  });
  it('sliding door: one button sets at the begin position and resets at the end position', () => {
    expect(pneumaticSignals('and-or', i(false, true), true, false)).toMatchObject({
      set: true,
      reset: false,
    });
    expect(pneumaticSignals('and-or', i(true, false), false, true)).toMatchObject({
      set: false,
      reset: true,
    });
  });
  it('memory valve keeps its state when both or neither pilot is present', () => {
    expect(memoryValve(true, false, false)).toBe(true);
    expect(memoryValve(false, true, true)).toBe(false);
    expect(memoryValve(false, true, false)).toBe(true);
  });
});

describe('pneumatics model (M08)', () => {
  it('accepts every preset; rejects 7 bar and a rod as large as the bore; warns on stall', () => {
    for (const p of Object.values(PNEUMATIC_PRESETS)) {
      expect(pneumaticsModel.validate(p).filter((x) => x.severity === 'error')).toEqual([]);
    }
    const P = PNEUMATIC_PRESETS.direct;
    expect(pneumaticsModel.validate({ ...P, supply: 7e5 })[0]?.parameter).toBe('supply');
    expect(pneumaticsModel.validate({ ...P, rod: 0.02 })[0]?.parameter).toBe('rod');
    expect(pneumaticsModel.validate({ ...P, loadForce: 500 })[0]?.severity).toBe('warning');
  });

  it('direct control: extends while the button is held, returns on release', () => {
    const P: PneumaticsParams = { ...PNEUMATIC_PRESETS.direct, s1: true };
    const r = new SimulationRunner(pneumaticsModel, P);
    r.runFor(1);
    expect(r.outputs.atExtended).toBe(1);
    expect(r.outputs.capPressureBar).toBeCloseTo(6, 9);
    r.start();
    r.setParams({ ...P, s1: false });
    r.runFor(3);
    expect(r.outputs.atRetracted).toBe(1);
  });

  it('AND with memory: no start unless retracted; the valve holds after release; 1S2 resets', () => {
    const P: PneumaticsParams = { ...PNEUMATIC_PRESETS['and-memory'], s1: true };
    const r = new SimulationRunner(pneumaticsModel, P);
    r.runFor(0.05);
    r.start();
    r.setParams({ ...P, s1: false });
    r.runFor(2);
    expect(r.outputs.atExtended).toBe(1);
    expect(r.outputs.memory).toBe(1);
    r.setParams({ ...P, s1: false, s2: true });
    r.runFor(2);
    expect(r.outputs.atRetracted).toBe(1);
    expect(r.outputs.memory).toBe(0);
  });

  it('outputs stroke times and forces; step size covers 1 % of the stroke', () => {
    const o = pneumaticsModel.outputs(0, [0, 0], PNEUMATIC_PRESETS['and-memory']);
    expect(o.extendTime).toBeGreaterThan(0);
    expect(o.extendForce).toBeCloseTo(0.9 * 3.5e5 * Math.PI * 0.0001, 6);
    expect(pneumaticsModel.fastestTimeConstant(PNEUMATIC_PRESETS.direct)).toBeGreaterThan(0);
  });
});

describe('ladder evaluator', () => {
  it('reports a chattering circuit (relay switching itself off)', () => {
    const bad = [{ branches: [[NC('K1')]], coil: 'K1' as const }];
    expect(evaluateLadder(bad, OFF, NOSENSE, NORELAY, false).stable).toBe(false);
  });

  it('faults: supply, broken S1 contact, welded K1, dead coil, broken first rung', () => {
    const L = [
      { branches: [[NO('S1')]], coil: 'K1' as const },
      { branches: [[NO('K1')]], coil: '1M1' as const },
    ];
    const on = { ...OFF, S1: true };
    expect(evaluateLadder(L, on, NOSENSE, NORELAY, false, 'supply').coils['1M1']).toBe(false);
    expect(evaluateLadder(L, on, NOSENSE, NORELAY, false, 'S1-contact').coils['1M1']).toBe(false);
    expect(evaluateLadder(L, OFF, NOSENSE, NORELAY, false, 'K1-welded').coils['1M1']).toBe(true);
    expect(evaluateLadder(L, on, NOSENSE, NORELAY, false, '1M1-coil').coils['1M1']).toBe(false);
    expect(evaluateLadder(L, on, NOSENSE, NORELAY, false, 'K1-coil').coils.K1).toBe(false);
    expect(evaluateLadder(L, on, NOSENSE, NORELAY, false, 'rung1-wire').rungsOn[0]).toBe(false);
  });
});

describe('electro-pneumatics model (M09)', () => {
  it('accepts presets; warns about a chattering ladder', () => {
    for (const p of Object.values(ELECTRO_PNEUMATIC_PRESETS)) {
      expect(electroPneumaticsModel.validate(p).filter((x) => x.severity === 'error')).toEqual([]);
    }
    const bad: ElectroPneumaticsParams = {
      ...ELECTRO_PNEUMATIC_PRESETS.partA,
      ladder: [{ branches: [[NC('K1')]], coil: 'K1' }],
    };
    expect(electroPneumaticsModel.validate(bad)[0]?.severity).toBe('warning');
  });

  it('Part C: power-fail safe — at rest the single-acting cylinder is extended; a button retracts it', () => {
    const P = ELECTRO_PNEUMATIC_PRESETS.partC;
    expect(electroPneumaticsModel.init(P)[1]).toBe(P.stroke);
    const r = new SimulationRunner(electroPneumaticsModel, { ...P, s2: true });
    r.runFor(2);
    expect(r.outputs.x2Mm).toBe(0);
  });

  it('timer: 1A1 extends, waits the delay at 1B2, then returns', () => {
    const P = { ...ELECTRO_PNEUMATIC_PRESETS.timer, timerDelay: 1 };
    const r = new SimulationRunner(electroPneumaticsModel, { ...P, s1: true });
    r.runFor(0.05);
    r.start();
    r.setParams(P);
    r.runFor(0.9);
    expect(r.outputs.sensor_1B2).toBe(1);
    r.runFor(2);
    expect(r.outputs.x1Mm).toBe(0);
  });

  it('currents: S1 carries the 0.5 A coil in direct control and only the relay in indirect control', () => {
    const a = electroPneumaticsModel.outputs(0, [0, 0, 0, 0, 0, 0, 0], {
      ...ELECTRO_PNEUMATIC_PRESETS.partA,
      s1: true,
    });
    expect(a.s1Current).toBeCloseTo(0.5, 9);
    const b = electroPneumaticsModel.outputs(0, [0, 0, 1, 0, 0, 0, 0], {
      ...ELECTRO_PNEUMATIC_PRESETS.partB,
      s1: true,
    });
    expect(b.s1Current).toBeCloseTo(24 / 580, 9);
    expect(b.supplyCurrent).toBeCloseTo(0.5 + 24 / 580, 9);
  });
});

describe('hydraulics model (M10)', () => {
  it('accepts presets; warns when the load cannot be raised below the relief setting', () => {
    for (const p of Object.values(HYDRAULIC_PRESETS)) {
      expect(hydraulicsModel.validate(p).filter((x) => x.severity === 'error')).toEqual([]);
    }
    const heavy = { ...HYDRAULIC_PRESETS['4a-ex2'], loadForce: 600 };
    expect(hydraulicsModel.validate(heavy)[0]?.severity).toBe('warning');
    expect(hydraulicsModel.validate({ ...heavy, reliefSetting: 7e6 })[0]?.parameter).toBe(
      'reliefSetting',
    );
  });

  it('Lab 4a Ex 2: lowers with the lever released, raises with the lever and pump, holds with the pump off', () => {
    const P: HydraulicsParams = { ...HYDRAULIC_PRESETS['4a-ex2'] };
    const r = new SimulationRunner(hydraulicsModel, P);
    r.runFor(2);
    expect(r.outputs.positionMm).toBe(200);
    r.start();
    r.setParams({ ...P, lever: true, pumpOn: true });
    r.runFor(0.3);
    expect(r.outputs.velocity).toBeLessThan(0);
    r.setParams({ ...P, lever: true, pumpOn: false });
    const x = r.outputs.positionMm;
    r.runFor(0.5);
    expect(r.outputs.positionMm).toBeCloseTo(x, 9);
  });

  it('Lab 4a Ex 3: at the end of the stroke the pump pressure rises to the relief setting', () => {
    const P = { ...HYDRAULIC_PRESETS['4a-ex3'], pumpOn: true, lever: true };
    const r = new SimulationRunner(hydraulicsModel, P);
    r.runFor(3);
    expect(r.outputs.positionMm).toBe(200);
    expect(r.outputs.pumpPressure).toBeCloseTo(5e6, -3);
    expect(r.outputs.reliefFlow).toBeCloseTo(2 / 60000, 9);
    expect(r.outputs.drivePower).toBeCloseTo(238.095, 2);
  });

  it('Lab 4b Ex 2: OR raises with either button; AND needs both; latch holds; S3 lowers', () => {
    const run = (p: HydraulicsParams, t: number) => {
      const r = new SimulationRunner(hydraulicsModel, p);
      r.runFor(t);
      return r;
    };
    const lowered = (c: HydraulicsParams['circuit']) => ({ ...HYDRAULIC_PRESETS[c], pumpOn: true });
    expect(run({ ...lowered('4b-ex2a'), s2: true }, 0.2).outputs.velocity).toBeLessThanOrEqual(0);
    expect(run({ ...lowered('4b-ex2b'), s1: true }, 0.2).outputs.coil_1M1).toBe(0);
    expect(run({ ...lowered('4b-ex2b'), s1: true, s2: true }, 0.2).outputs.coil_1M1).toBe(1);
    const latch = new SimulationRunner(hydraulicsModel, { ...lowered('4b-ex2c'), s1: true });
    latch.runFor(0.05);
    latch.start();
    latch.setParams(lowered('4b-ex2c'));
    latch.runFor(0.05);
    expect(latch.outputs.coil_1M1).toBe(1);
    const down = run({ ...lowered('4b-ex2a'), s3: true }, 0.2);
    expect(down.outputs.mode).toBe(2);
  });

  it('Lab 4a Ex 1: lowering with the pump running is slowed by the pump flow joining the outlet', () => {
    const P = { ...HYDRAULIC_PRESETS['4a-ex1'], lever: true };
    const free = hydraulicsModel.outputs(0, [0.1, 0, 0, 0], P);
    const pumped = hydraulicsModel.outputs(0, [0.1, 0, 0, 0], { ...P, pumpOn: true });
    expect(pumped.velocity).toBeLessThan(free.velocity);
    expect(hydraulicsModel.fastestTimeConstant(P)).toBeGreaterThan(0);
  });
});
