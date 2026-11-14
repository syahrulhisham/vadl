import { startTransition, useCallback, useEffect, useReducer, useState } from 'react';
import {
  SimulationRunner,
  type IntegratorName,
  type Issue,
  type Outputs,
  type RunnerOptions,
  type SimModel,
} from '@/sim-core';

/** Source of animation frames. The browser's requestAnimationFrame by default; tests inject their own. */
export interface FrameSource {
  request(callback: (nowMs: number) => void): number;
  cancel(id: number): void;
}

export const animationFrames: FrameSource = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
};

/** Longest real time credited to one frame, s. A hidden tab that wakes up does not jump ahead. */
export const MAX_FRAME_SECONDS = 0.1;

/**
 * Connects a `SimulationRunner` to React. The runner does all engineering work;
 * this hook only advances it once per animation frame while running and
 * re-renders when it changes.
 */
export function useSimulation<P, O extends Outputs, S extends readonly number[] = number[]>(
  model: SimModel<P, O, S>,
  options: RunnerOptions = {},
  frames: FrameSource = animationFrames,
) {
  // The runner is created once and kept for the component's lifetime.
  const [runner] = useState(() => new SimulationRunner(model, model.defaults, options));
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const status = runner.status;

  useEffect(() => {
    if (status !== 'running') return undefined;
    let last: number | null = null;
    let seen = runner.version;
    let id = frames.request(function frame(now) {
      if (last !== null) runner.tick(Math.min(MAX_FRAME_SECONDS, (now - last) / 1000));
      last = now;
      if (runner.version !== seen) {
        seen = runner.version;
        // Live display updates are non-urgent: as a transition they never starve
        // a navigation (React Router navigates in a transition) or typing in a control.
        startTransition(() => rerender());
      }
      if (runner.status === 'running') id = frames.request(frame);
    });
    return () => frames.cancel(id);
  }, [runner, status, frames]);

  const act = useCallback(
    <A extends unknown[], R>(fn: (...args: A) => R) =>
      (...args: A): R => {
        const result = fn(...args);
        rerender();
        return result;
      },
    [],
  );

  return {
    runner,
    status,
    time: runner.time,
    outputs: runner.outputs,
    params: runner.parameters,
    lagging: runner.lagging,
    dt: runner.dt,
    method: runner.method,
    endTime: runner.endTime,
    trace: runner.trace(),
    start: act(() => runner.start()),
    pause: act(() => runner.pause()),
    stop: act(() => runner.stop()),
    reset: act(() => runner.reset()),
    setParams: act((p: P): Issue[] => runner.setParams(p)),
    setMethod: act((m: IntegratorName) => runner.setMethod(m)),
    setTimeScale: act((s: number) => runner.setTimeScale(s)),
    setEndTime: act((t: number | undefined) => runner.setEndTime(t)),
  };
}
