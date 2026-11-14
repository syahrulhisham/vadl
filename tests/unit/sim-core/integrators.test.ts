/**
 * Integrators against analytic solutions. Expected values are literal numbers:
 *   e^(−1) = 0.36787944, cos(1) = 0.54030231, −sin(1) = −0.84147098.
 */
import { describe, expect, it } from 'vitest';
import { eulerStep, integrate, rk4Step, step, type Derivative } from '@/sim-core';

const decay: Derivative = (_t, s) => [-(s[0] as number)];
const oscillator: Derivative = (_t, s) => [s[1] as number, -(s[0] as number)];
const E_MINUS_1 = 0.36787944;

describe('single steps', () => {
  it('Euler takes y + h·f', () => {
    expect(eulerStep(decay, 0, [1], 0.1)).toEqual([0.9]);
  });

  it('RK4 matches the Taylor series of e^(−h) to fourth order', () => {
    // 1 − h + h²/2 − h³/6 + h⁴/24 at h = 0.1 = 0.9048375
    expect(rk4Step(decay, 0, [1], 0.1)[0]).toBeCloseTo(0.9048375, 10);
  });

  it('does not mutate the input state', () => {
    const s = [1, 0];
    rk4Step(oscillator, 0, s, 0.1);
    eulerStep(oscillator, 0, s, 0.1);
    expect(s).toEqual([1, 0]);
  });

  it('rejects non-positive or non-finite step sizes', () => {
    expect(() => step('rk4', decay, 0, [1], 0)).toThrow(RangeError);
    expect(() => step('euler', decay, 0, [1], -0.1)).toThrow(RangeError);
    expect(() => step('rk4', decay, 0, [1], Number.NaN)).toThrow(RangeError);
  });

  it('rejects a derivative of the wrong length', () => {
    expect(() => eulerStep(() => [1, 2], 0, [1], 0.1)).toThrow(/does not match/);
  });
});

describe('integration against analytic solutions', () => {
  it('exponential decay to t = 1: RK4 within 1e−7, Euler within 2e−3 at h = 0.001', () => {
    expect(integrate('rk4', decay, [1], 0, 1, 0.01)[0]).toBeCloseTo(E_MINUS_1, 7);
    expect(
      Math.abs((integrate('euler', decay, [1], 0, 1, 0.001)[0] as number) - E_MINUS_1),
    ).toBeLessThan(2e-3);
  });

  it('harmonic oscillator to t = 1 with RK4: x = cos 1, v = −sin 1', () => {
    const [x, v] = integrate('rk4', oscillator, [1, 0], 0, 1, 0.01);
    expect(x).toBeCloseTo(0.54030231, 8);
    expect(v).toBeCloseTo(-0.84147098, 8);
  });

  it('RK4 conserves oscillator energy far better than Euler over 10 s', () => {
    const energy = (s: number[]) => ((s[0] as number) ** 2 + (s[1] as number) ** 2) / 2;
    const rk = energy(integrate('rk4', oscillator, [1, 0], 0, 10, 0.05));
    const eu = energy(integrate('euler', oscillator, [1, 0], 0, 10, 0.05));
    expect(Math.abs(rk - 0.5)).toBeLessThan(1e-6);
    expect(eu).toBeGreaterThan(0.6); // forward Euler gains energy on an oscillator
  });

  it('lands exactly on tEnd when the step does not divide the interval', () => {
    // 0.3 is not a whole number of 0.07 steps; the last step is shortened.
    // e^(−0.3) = 0.74081822. Overshooting by a step (to 0.35) would give 0.7047, far outside 1e−6.
    expect(integrate('rk4', decay, [1], 0, 0.3, 0.07)[0]).toBeCloseTo(0.74081822, 6);
  });

  it('returns the initial state for a zero-length interval and rejects reversed ones', () => {
    expect(integrate('rk4', decay, [2], 1, 1, 0.1)).toEqual([2]);
    expect(() => integrate('rk4', decay, [1], 1, 0, 0.1)).toThrow(RangeError);
  });
});

describe('order of accuracy (halving the step)', () => {
  function errorAt(method: 'euler' | 'rk4', h: number) {
    return Math.abs((integrate(method, decay, [1], 0, 1, h)[0] as number) - Math.exp(-1));
  }

  it('Euler is first order: error ratio ≈ 2', () => {
    const ratio = errorAt('euler', 0.02) / errorAt('euler', 0.01);
    expect(ratio).toBeGreaterThan(1.9);
    expect(ratio).toBeLessThan(2.1);
  });

  it('RK4 is fourth order: error ratio ≈ 16', () => {
    const ratio = errorAt('rk4', 0.1) / errorAt('rk4', 0.05);
    expect(ratio).toBeGreaterThan(15);
    expect(ratio).toBeLessThan(17);
  });
});
