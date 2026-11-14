/**
 * RC-ENG-01: first-order RL circuit step response.
 * Expected values are copied as literals from docs/reference-cases/rl-circuit-step.md
 * (hand calculation). They are not recomputed with the formula under test.
 */
import { describe, expect, it } from 'vitest';
import { rlCircuitModel, SimulationRunner, type RlParams } from '@/sim-core';

const P: RlParams = { voltage: 10, resistance: 10, inductance: 0.1 };
const TAU = 0.01;

function currentAt(t: number, method: 'rk4' | 'euler' = 'rk4', maxDt?: number) {
  const r = new SimulationRunner(rlCircuitModel, P, { method, ...(maxDt ? { maxDt } : {}) });
  r.runFor(t);
  return r;
}

describe('RC-ENG-01 RL step response', () => {
  it('τ = 0.01 s; final current 1 A; di/dt(0) = 100 A/s; ½·L·I∞² = 0.05 J', () => {
    const out = rlCircuitModel.outputs(0, [0], P);
    expect(out.timeConstant).toBeCloseTo(0.01, 12);
    expect(out.finalCurrent).toBe(1);
    expect(rlCircuitModel.derivatives(0, [0], P)[0]).toBeCloseTo(100, 12);
    expect(0.5 * P.inductance * out.finalCurrent ** 2).toBeCloseTo(0.05, 12);
  });

  it.each([
    [1, 0.632121],
    [2, 0.864665],
    [3, 0.950213],
    [5, 0.993262],
  ])('RK4 at Δt = τ/10: i(%iτ) = %f A within 1e−6 A', (n, expected) => {
    const r = currentAt(n * TAU);
    expect(r.dt).toBeCloseTo(TAU / 10, 15);
    expect(Math.abs(r.outputs.current - expected)).toBeLessThan(1e-6);
  });

  it('at t = τ: v_R = 6.32121 V and v_L = 3.67879 V (within 1e−5 V)', () => {
    const out = currentAt(TAU).outputs;
    expect(Math.abs(out.resistorVoltage - 6.32121)).toBeLessThan(1e-5);
    expect(Math.abs(out.inductorVoltage - 3.67879)).toBeLessThan(1e-5);
  });

  it('forward Euler at Δt = τ/1000: i(τ) = 0.632121 A within 5e−4 A', () => {
    const r = currentAt(TAU, 'euler', TAU / 1000);
    expect(Math.abs(r.outputs.current - 0.632121)).toBeLessThan(5e-4);
  });
});
