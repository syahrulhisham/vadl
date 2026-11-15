import { describe, expect, it } from 'vitest';
import {
  converterCharacteristic,
  converterPeriod,
  converterStats,
  degToRad,
  gatePulse,
  PC_DEFAULTS,
  powerConverterModel,
  rectifierBreakpoints,
  SimulationRunner,
  triangleCarrier,
  type PowerConverterParams,
  waveStats,
} from '@/sim-core';

const rect = (over: Partial<PowerConverterParams>): PowerConverterParams => ({
  ...PC_DEFAULTS,
  ...over,
});

describe('rectifier statistics', () => {
  it('Lab 1 half-wave thyristor, 240 V, α 30°, 100 Ω: Vavg 100.801 V, Iavg 1.00801 A', () => {
    const s = converterStats(rect({ rectifier: 'thyristor-half', alpha: degToRad(30) }));
    expect(s.vAverage).toBeCloseTo(100.801, 2);
    expect(s.iAverage).toBeCloseTo(1.00801, 4);
  });

  it('input power factor: bridge with R load 1; half-wave diode 1/√2 = 0.70711', () => {
    expect(converterStats(rect({ rectifier: 'diode-bridge' })).inputPowerFactor).toBeCloseTo(1, 3);
    expect(converterStats(rect({ rectifier: 'diode-half' })).inputPowerFactor).toBeCloseTo(
      0.70711,
      3,
    );
  });

  it('full bridge, inductive load, α 30°: input PF (2√2/π)·cos α = 0.779697; current ripple-free', () => {
    const p = rect({ rectifier: 'thyristor-bridge-l', alpha: degToRad(30) });
    const s = converterStats(p);
    expect(s.inputPowerFactor).toBeCloseTo(0.779697, 3);
    expect(s.iRms).toBeCloseTo(s.iAverage, 9);
  });

  it('inverting with a passive load gives zero current, as stated in the assumptions', () => {
    const s = converterStats(rect({ rectifier: 'thyristor-bridge-l', alpha: degToRad(120) }));
    expect(s.vAverage).toBeLessThan(0);
    expect(s.iAverage).toBe(0);
  });

  it('three-phase bridge: supply current is not modelled per phase (shown as —)', () => {
    const p = rect({ rectifier: 'three-phase-bridge-l', supplyRms: 400 });
    expect(Number.isNaN(converterStats(p).inputPowerFactor)).toBe(true);
    expect(Number.isNaN(powerConverterModel.outputs(0.001, [0.001], p).iSupply)).toBe(true);
  });

  it('caches statistics per parameter object', () => {
    const p = rect({});
    expect(converterStats(p)).toBe(converterStats(p));
  });
});

describe('instantaneous values', () => {
  it('rectifier output follows the supply after the firing angle', () => {
    const p = rect({ rectifier: 'thyristor-half', alpha: degToRad(90) });
    const quarter = 1 / 50 / 4; // θ = 90°
    expect(powerConverterModel.outputs(quarter * 0.5, [0], p).vOut).toBe(0); // θ = 45°, before firing
    expect(powerConverterModel.outputs(quarter * 1.2, [0], p).vOut).toBeGreaterThan(300);
  });

  it('gate pulses at α and α + π for a bridge, six per cycle for three-phase', () => {
    expect(gatePulse('thyristor-bridge-r', degToRad(30), degToRad(31))).toBe(1);
    expect(gatePulse('thyristor-bridge-r', degToRad(30), degToRad(211))).toBe(1);
    expect(gatePulse('thyristor-bridge-r', degToRad(30), degToRad(100))).toBe(0);
    expect(gatePulse('diode-bridge', 0, 0)).toBe(0);
  });

  it('DC-DC: inductor current is triangular between Imin and Imax; the gate is on for D·Ts', () => {
    const p = rect({ family: 'dcdc' });
    const ts = 1 / 20_000;
    const at = (t: number) => powerConverterModel.outputs(t, [t], p);
    expect(at(0).iInductor).toBeCloseTo(1.632, 9);
    expect(at(0.4 * ts - 1e-12).iInductor).toBeCloseTo(2.208, 6);
    expect(at(0.2 * ts).gate).toBe(1);
    expect(at(0.6 * ts).gate).toBe(0);
    expect(at(0).continuous).toBe(1);
  });

  it('inverter: carrier is a triangle in −1…1 and the reference is ma·sin θ', () => {
    expect(triangleCarrier(0, 21)).toBe(-1);
    const p = rect({ family: 'inverter' });
    const o = powerConverterModel.outputs(1 / 50 / 4, [0], p);
    expect(o.reference).toBeCloseTo(0.8, 9);
    expect(Math.abs(o.vOut)).toBe(200);
    expect(o.vFundamental).toBeCloseTo(113.137, 0);
  });
});

describe('characteristic, validation, step', () => {
  it('characteristic gives Vavg(α), Vo(D) and V1(ma)', () => {
    expect(
      converterCharacteristic(rect({ rectifier: 'thyristor-bridge-r' }), degToRad(90)),
    ).toBeCloseTo(108.038, 1);
    expect(
      converterCharacteristic(rect({ family: 'dcdc', dcdc: 'boost', dcInput: 12 }), 0.6),
    ).toBeCloseTo(30, 9);
    expect(converterCharacteristic(rect({ family: 'inverter' }), 0.5)).toBeCloseTo(70.7107, 3);
  });

  it('validates per family; mf must be whole; DCM warns', () => {
    expect(powerConverterModel.validate(PC_DEFAULTS)).toEqual([]);
    expect(powerConverterModel.validate(rect({ alpha: degToRad(200) }))[0]?.message).toBe(
      'Firing angle must be between 0 and 180 °.',
    );
    expect(
      powerConverterModel.validate(rect({ family: 'inverter', frequencyRatio: 20.5 }))[0]?.message,
    ).toMatch(/whole number/);
    const dcm = powerConverterModel.validate(rect({ family: 'dcdc', inductance: 100e-6 }));
    expect(dcm[0]?.severity).toBe('warning');
    expect(dcm[0]?.message).toMatch(/Lmin = 150 µH/);
  });

  it('periods and step sizes: 1000 steps per supply cycle, 100 per switching or carrier period', () => {
    expect(converterPeriod(PC_DEFAULTS)).toBeCloseTo(0.02, 12);
    const r = new SimulationRunner(powerConverterModel, PC_DEFAULTS);
    expect(r.dt).toBeCloseTo(0.02 / 1000, 12);
    expect(new SimulationRunner(powerConverterModel, rect({ family: 'dcdc' })).dt).toBeCloseTo(
      1 / 20_000 / 100,
      15,
    );
    expect(new SimulationRunner(powerConverterModel, rect({ family: 'inverter' })).dt).toBeCloseTo(
      0.02 / 21 / 100,
      15,
    );
  });

  it('time advances one-for-one in the state', () => {
    const r = new SimulationRunner(powerConverterModel, PC_DEFAULTS);
    r.runFor(0.01);
    expect(r.state[0]).toBeCloseTo(0.01, 9);
  });
});

describe('piecewise midpoint integration', () => {
  it('splitting at a jump makes a step function exact; without the split the grid error shows', () => {
    const step = (t: number) => (t < 0.33 ? 1 : 0);
    expect(waveStats(step, 1, 10, [0.33]).average).toBeCloseTo(0.33, 12);
    expect(waveStats(step, 1, 10).average).toBeCloseTo(0.3, 12);
  });

  it('rectifier breakpoints are the zero crossings and firing angles; segment edges plus six firing instants for three-phase', () => {
    expect(rectifierBreakpoints('thyristor-half', degToRad(30))).toEqual([
      0,
      Math.PI,
      degToRad(30),
    ]);
    expect(rectifierBreakpoints('three-phase-bridge-l', degToRad(30))).toHaveLength(12);
  });

  it('Lab 1 half-wave thyristor at 120°: Vavg 27.0095 V (RC-M03-01) to 1e-6 relative', () => {
    expect(converterStats(rect({ alpha: degToRad(120) })).vAverage).toBeCloseTo(27.0095, 4);
  });
});
