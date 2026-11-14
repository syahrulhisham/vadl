import { describe, expect, it } from 'vitest';
import { rlCircuitModel, SimulationRunner, STEP_FRACTION, type RlParams } from '@/sim-core';

const P: RlParams = { voltage: 10, resistance: 10, inductance: 0.1 }; // τ = 10 ms

function runner(options = {}) {
  return new SimulationRunner(rlCircuitModel, P, options);
}

describe('SimulationRunner controls (FR-04)', () => {
  it('starts idle at t = 0 with the initial state recorded', () => {
    const r = runner();
    expect(r.status).toBe('idle');
    expect(r.time).toBe(0);
    expect(r.outputs.current).toBe(0);
    expect(r.trace()).toHaveLength(1);
  });

  it('only advances while running', () => {
    const r = runner();
    expect(r.tick(1)).toBe(0);
    r.start();
    expect(r.tick(0.01)).toBe(10); // 10 ms at 1 ms steps
    r.pause();
    expect(r.status).toBe('paused');
    expect(r.tick(1)).toBe(0);
    r.start(); // resume
    expect(r.status).toBe('running');
  });

  it('stop halts the run until reset; start is then ignored', () => {
    const r = runner();
    r.start();
    r.tick(0.005);
    r.stop();
    expect(r.status).toBe('stopped');
    r.start();
    expect(r.status).toBe('stopped');
    r.reset();
    expect(r.status).toBe('idle');
    expect(r.time).toBe(0);
    expect(r.trace()).toHaveLength(1);
  });

  it('pause and stop are ignored when they do not apply', () => {
    const r = runner();
    r.pause();
    r.stop();
    expect(r.status).toBe('idle');
  });

  it('finishes exactly at the end time and signals the change', () => {
    const r = runner({ endTime: 0.05 });
    r.start();
    const before = r.version;
    r.tick(10); // far more than needed
    expect(r.status).toBe('finished');
    expect(r.time).toBe(0.05);
    expect(r.version).toBeGreaterThan(before);
    expect(r.trace().at(-1)?.t).toBe(0.05);
  });

  it('signals finishing even when the last frame takes no counted step', () => {
    const r = runner({ endTime: 0.003 });
    r.start();
    r.tick(0.003); // reaches the end inside this frame
    const v = r.version;
    expect(r.status).toBe('finished');
    expect(r.tick(1)).toBe(0);
    expect(r.version).toBe(v);
  });

  it('shortens the last step when the end time is not a whole number of steps', () => {
    const r = runner({ endTime: 0.0125 });
    r.start();
    r.tick(1);
    expect(r.time).toBe(0.0125);
  });
});

describe('step-size rule and options', () => {
  it('uses Δt = τ/10 by default and the smaller of maxDt and τ/10 when given', () => {
    expect(STEP_FRACTION).toBe(0.1);
    expect(runner().dt).toBeCloseTo(0.001, 15);
    expect(runner({ maxDt: 0.0002 }).dt).toBeCloseTo(0.0002, 15);
    expect(runner({ maxDt: 1 }).dt).toBeCloseTo(0.001, 15);
  });

  it('time scale slows the simulation relative to real time', () => {
    const r = runner({ timeScale: 0.01 });
    r.start();
    expect(r.tick(1)).toBe(10); // 1 real second → 10 ms simulated
    r.setTimeScale(0.001);
    expect(r.timeScale).toBe(0.001);
    expect(() => r.setTimeScale(0)).toThrow(RangeError);
  });

  it('reports lagging when the step cap is hit', () => {
    const r = runner({ maxStepsPerFrame: 5 });
    r.start();
    expect(r.tick(1)).toBe(5);
    expect(r.lagging).toBe(true);
  });

  it('records at most once per record interval', () => {
    const r = runner({ recordInterval: 0.005 });
    r.runFor(0.02);
    expect(r.trace().map((s) => Math.round(s.t * 1000))).toEqual([0, 5, 10, 15, 20]);
  });

  it('switches integrator', () => {
    const r = runner();
    r.setMethod('euler');
    expect(r.method).toBe('euler');
  });

  it('changes the end time only before starting', () => {
    const r = runner();
    r.setEndTime(0.02);
    expect(r.endTime).toBe(0.02);
    expect(() => r.setEndTime(-1)).toThrow(RangeError);
    r.start();
    expect(() => r.setEndTime(0.03)).toThrow(/only before starting/);
  });
});

describe('parameter validation (FR-05)', () => {
  it('refuses invalid parameters and keeps the old ones', () => {
    const r = runner();
    const issues = r.setParams({ ...P, resistance: 0 });
    expect(issues.some((i) => i.parameter === 'resistance' && i.severity === 'error')).toBe(true);
    expect(r.parameters).toEqual(P);
  });

  it('accepts valid parameters; while idle the trace restarts from the new initial state', () => {
    const r = runner();
    expect(r.setParams({ ...P, voltage: 20 })).toEqual([]);
    expect(r.parameters.voltage).toBe(20);
    expect(r.trace()).toHaveLength(1);
  });

  it('accepts a change while running and continues from the present state', () => {
    const r = runner();
    r.start();
    r.tick(0.01);
    const iBefore = r.outputs.current;
    r.setParams({ ...P, voltage: 20 });
    expect(r.outputs.current).toBe(iBefore);
    expect(r.time).toBeCloseTo(0.01, 12);
  });

  it('refuses to construct with invalid parameters', () => {
    expect(() => new SimulationRunner(rlCircuitModel, { ...P, inductance: 0 })).toThrow(
      /Invalid initial/,
    );
  });
});
