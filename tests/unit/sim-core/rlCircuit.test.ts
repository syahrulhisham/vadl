import { describe, expect, it } from 'vitest';
import {
  rlCircuitModel,
  rlCurrentDerivative,
  rlStepResponse,
  rlTimeConstant,
  SimulationRunner,
  type RlParams,
  type Sample,
} from '@/sim-core';

const P: RlParams = { voltage: 10, resistance: 10, inductance: 0.1 };

describe('RL circuit equations', () => {
  it('τ = L/R', () => {
    expect(rlTimeConstant(0.1, 10)).toBeCloseTo(0.01, 15);
    expect(rlTimeConstant(2, 4)).toBe(0.5);
  });

  it('di/dt = (V − R·i)/L: 100 A/s at i = 0, zero at i = V/R', () => {
    expect(rlCurrentDerivative(10, 10, 0.1, 0)).toBeCloseTo(100, 12);
    expect(rlCurrentDerivative(10, 10, 0.1, 1)).toBe(0);
  });

  it('analytic response decays from a non-zero initial current', () => {
    // From 2 A towards 1 A: at t = τ, i = 1 + (2 − 1)·e^(−1) = 1.3678794
    expect(rlStepResponse(10, 10, 0.1, 0.01, 2)).toBeCloseTo(1.3678794, 6);
  });
});

describe('RL circuit model', () => {
  it('validates each parameter with an engineering explanation', () => {
    expect(rlCircuitModel.validate(P)).toEqual([]);
    const bad = rlCircuitModel.validate({ voltage: -1, resistance: 0, inductance: 0 });
    expect(bad.map((i) => i.parameter)).toEqual(['voltage', 'resistance', 'inductance']);
    expect(bad[1]?.message).toMatch(/rise without limit/);
    expect(bad[2]?.message).toMatch(/change instantly/);
  });

  it('rejects values outside the bench ranges', () => {
    const issues = rlCircuitModel.validate({ voltage: 300, resistance: 5000, inductance: 20 });
    expect(issues).toHaveLength(3);
    expect(rlCircuitModel.validate({ ...P, resistance: Number.NaN })[0]?.parameter).toBe(
      'resistance',
    );
  });

  it('outputs satisfy v_R + v_L = V at every recorded step', () => {
    const r = new SimulationRunner(rlCircuitModel, P);
    r.runFor(0.05);
    for (const s of r.trace()) {
      expect(
        (s.values.resistorVoltage as number) + (s.values.inductorVoltage as number),
      ).toBeCloseTo(10, 10);
    }
  });

  it('a rising step never overshoots the final current', () => {
    const r = new SimulationRunner(rlCircuitModel, P);
    r.runFor(0.1);
    for (const s of r.trace()) expect(s.values.current as number).toBeLessThanOrEqual(1 + 1e-12);
  });

  it('reports 0 % of final current when V = 0 instead of dividing by zero', () => {
    const out = rlCircuitModel.outputs(0, [0], { ...P, voltage: 0 });
    expect(out.fractionOfFinal).toBe(0);
    expect(out.finalCurrent).toBe(0);
  });

  it('energy balance: source energy = resistor energy + stored energy (RK4, Δt = τ/100)', () => {
    const r = new SimulationRunner(rlCircuitModel, P, { maxDt: 0.0001 });
    r.runFor(0.05);
    const trace = r.trace();
    let source = 0;
    let resistor = 0;
    for (let k = 1; k < trace.length; k += 1) {
      const a = trace[k - 1] as Sample;
      const b = trace[k] as Sample;
      const h = b.t - a.t;
      const ia = a.values.current as number;
      const ib = b.values.current as number;
      source += (h * (P.voltage * ia + P.voltage * ib)) / 2;
      resistor += (h * (P.resistance * ia * ia + P.resistance * ib * ib)) / 2;
    }
    const iEnd = r.outputs.current;
    const stored = 0.5 * P.inductance * iEnd * iEnd;
    expect(source).toBeCloseTo(resistor + stored, 4);
  });
});
