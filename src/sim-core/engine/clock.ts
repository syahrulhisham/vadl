/**
 * Fixed-step clock with an accumulator ("fix your timestep"). Real elapsed time,
 * scaled by the time scale, is added to an accumulator; the simulation then takes
 * as many whole fixed steps as fit. The leftover carries to the next frame, so
 * the simulated result is the same whatever the display frame rate (NFR-05).
 */

export interface ClockState {
  /** Simulated time not yet consumed by whole steps, s. Always 0 ≤ accumulator < dt (unless capped). */
  readonly accumulator: number;
}

export interface ClockAdvance {
  readonly clock: ClockState;
  /** Whole steps to take this frame. */
  readonly steps: number;
  /** True when the step cap was hit and simulated time fell behind the requested rate. */
  readonly lagging: boolean;
}

export const INITIAL_CLOCK: ClockState = { accumulator: 0 };

/**
 * @param realElapsed Wall-clock seconds since the last frame. Negative or non-finite values count as 0.
 * @param timeScale   Simulated seconds per real second (e.g. 0.01 shows a 10 ms transient over 1 s).
 * @param dt          Fixed simulation step, s.
 * @param maxSteps    Cap on steps per frame, so a tiny dt cannot freeze the page.
 */
export function advanceClock(
  clock: ClockState,
  realElapsed: number,
  timeScale: number,
  dt: number,
  maxSteps: number,
): ClockAdvance {
  if (!(dt > 0)) throw new RangeError(`dt must be positive, got ${dt}`);
  const elapsed = Number.isFinite(realElapsed) && realElapsed > 0 ? realElapsed : 0;
  const acc = clock.accumulator + elapsed * Math.max(0, timeScale);
  const wanted = Math.floor(acc / dt + 1e-9);
  if (wanted > maxSteps) {
    // Drop the backlog rather than carry it: the display slows down instead of
    // trying to catch up with ever larger bursts.
    return { clock: { accumulator: 0 }, steps: maxSteps, lagging: true };
  }
  return { clock: { accumulator: Math.max(0, acc - wanted * dt) }, steps: wanted, lagging: false };
}
