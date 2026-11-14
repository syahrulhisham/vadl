// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSimulation, type FrameSource } from '@/hooks';
import { rlCircuitModel } from '@/sim-core';

/** Manually driven animation frames. */
function fakeFrames() {
  let next = 1;
  const pending = new Map<number, (now: number) => void>();
  const source: FrameSource = {
    request: (cb) => {
      const id = next++;
      pending.set(id, cb);
      return id;
    },
    cancel: (id) => {
      pending.delete(id);
    },
  };
  /** Fire all pending callbacks at time `nowMs`. */
  function fire(nowMs: number) {
    const cbs = [...pending.values()];
    pending.clear();
    act(() => cbs.forEach((cb) => cb(nowMs)));
  }
  return { source, fire, pendingCount: () => pending.size };
}

describe('useSimulation', () => {
  it('does not request frames until started', () => {
    const f = fakeFrames();
    const { result } = renderHook(() => useSimulation(rlCircuitModel, {}, f.source));
    expect(result.current.status).toBe('idle');
    expect(f.pendingCount()).toBe(0);
  });

  it('advances by real elapsed time between frames and re-renders', () => {
    const f = fakeFrames();
    const { result } = renderHook(() =>
      useSimulation(rlCircuitModel, { timeScale: 0.01 }, f.source),
    );
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    f.fire(0); // first frame only sets the reference time
    expect(result.current.time).toBe(0);
    f.fire(100); // 0.1 s real × 0.01 = 1 ms simulated = one step
    expect(result.current.time).toBeCloseTo(0.001, 12);
    expect(result.current.trace.length).toBeGreaterThan(1);
  });

  it('credits at most 0.1 s per frame, so a sleeping tab does not jump ahead', () => {
    const f = fakeFrames();
    const { result } = renderHook(() =>
      useSimulation(rlCircuitModel, { timeScale: 0.01 }, f.source),
    );
    act(() => result.current.start());
    f.fire(0);
    f.fire(60_000); // a minute later
    expect(result.current.time).toBeCloseTo(0.001, 12);
  });

  it('stops requesting frames when paused, finished or unmounted', () => {
    const f = fakeFrames();
    const { result, unmount } = renderHook(() =>
      useSimulation(rlCircuitModel, { endTime: 0.002, timeScale: 1 }, f.source),
    );
    act(() => result.current.start());
    f.fire(0);
    act(() => result.current.pause());
    expect(f.pendingCount()).toBe(0);
    act(() => result.current.start());
    f.fire(0);
    f.fire(100); // reaches the 2 ms end time
    expect(result.current.status).toBe('finished');
    expect(f.pendingCount()).toBe(0);
    act(() => result.current.reset());
    act(() => result.current.start());
    expect(f.pendingCount()).toBe(1);
    unmount();
    expect(f.pendingCount()).toBe(0);
  });

  it('exposes validated parameter changes and the other controls', () => {
    const f = fakeFrames();
    const { result } = renderHook(() => useSimulation(rlCircuitModel, {}, f.source));
    let issues: ReturnType<typeof result.current.setParams> = [];
    act(() => {
      issues = result.current.setParams({ voltage: 10, resistance: 0, inductance: 0.1 });
    });
    expect(issues[0]?.parameter).toBe('resistance');
    act(() => {
      result.current.setParams({ voltage: 20, resistance: 10, inductance: 0.1 });
      result.current.setMethod('euler');
      result.current.setTimeScale(0.5);
      result.current.setEndTime(0.05);
    });
    expect(result.current.params.voltage).toBe(20);
    expect(result.current.method).toBe('euler');
    expect(result.current.endTime).toBe(0.05);
    expect(result.current.outputs.finalCurrent).toBe(2);
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.status).toBe('stopped');
  });
});
