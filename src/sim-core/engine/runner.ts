/**
 * Simulation runner: drives a `SimModel` with a fixed step, independent of the
 * display. Implements the laboratory controls of FR-04 (start, pause, resume,
 * stop, reset), the step-size rule (Δt ≤ τ_min/10, plan §5), parameter
 * validation before use (FR-05) and trace recording.
 *
 * The runner is plain TypeScript with no timers: the UI calls `tick(realElapsed)`
 * once per animation frame. Tests call it directly.
 */
import type { Issue, SimModel } from '../types';
import { advanceClock, INITIAL_CLOCK, type ClockState } from './clock';
import { step, type IntegratorName } from './integrators';
import { Recorder, type Sample } from './recorder';

/**
 * idle: reset, not yet started · running · paused: can resume ·
 * stopped: halted by the user, must reset · finished: reached the end time, must reset.
 */
export type RunStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'finished';

export type Outputs = Readonly<Record<string, number>>;

export interface RunnerOptions {
  readonly method?: IntegratorName;
  /** Largest step the caller wants, s. The runner may use a smaller one (step-size rule). */
  readonly maxDt?: number;
  /** Simulated seconds per real second. */
  readonly timeScale?: number;
  /** Stop automatically at this simulated time, s. Omit to run until stopped. */
  readonly endTime?: number;
  readonly recorderCapacity?: number;
  /** Record a sample at most this often in simulated time, s. Defaults to every step. */
  readonly recordInterval?: number;
  /** Cap on integration steps per frame. */
  readonly maxStepsPerFrame?: number;
}

/** Fraction of the fastest time constant used as the maximum step (plan §5: one tenth). */
export const STEP_FRACTION = 0.1;

export class SimulationRunner<P, O extends Outputs, S extends readonly number[] = number[]> {
  private params: P;
  private stateVec: S;
  private t = 0;
  private clock: ClockState = INITIAL_CLOCK;
  private lastRecorded = Number.NEGATIVE_INFINITY;
  private statusValue: RunStatus = 'idle';
  private laggingValue = false;
  private methodValue: IntegratorName;
  private timeScaleValue: number;
  private readonly recorder: Recorder;
  private readonly maxDt: number;
  private endTimeValue: number | undefined;
  private readonly recordInterval: number | undefined;
  private readonly maxStepsPerFrame: number;
  /** Increments on every change, so UIs can detect updates cheaply. */
  version = 0;

  constructor(
    private readonly model: SimModel<P, O, S>,
    params: P = model.defaults,
    options: RunnerOptions = {},
  ) {
    const issues = model.validate(params).filter((i) => i.severity === 'error');
    if (issues.length > 0) {
      throw new RangeError(`Invalid initial parameters: ${issues.map((i) => i.message).join(' ')}`);
    }
    this.params = params;
    this.methodValue = options.method ?? 'rk4';
    this.timeScaleValue = options.timeScale ?? 1;
    this.maxDt = options.maxDt ?? Number.POSITIVE_INFINITY;
    this.endTimeValue = options.endTime;
    this.recordInterval = options.recordInterval;
    this.maxStepsPerFrame = options.maxStepsPerFrame ?? 20_000;
    this.recorder = new Recorder(options.recorderCapacity ?? 5_000);
    this.stateVec = model.init(params);
    this.record(true);
  }

  // ----- read-only views -------------------------------------------------

  get status(): RunStatus {
    return this.statusValue;
  }
  get time(): number {
    return this.t;
  }
  get state(): S {
    return this.stateVec;
  }
  get parameters(): P {
    return this.params;
  }
  get method(): IntegratorName {
    return this.methodValue;
  }
  get timeScale(): number {
    return this.timeScaleValue;
  }
  /** True when the last frame hit the step cap (display slower than requested). */
  get lagging(): boolean {
    return this.laggingValue;
  }
  /** Effective fixed step: min(maxDt, τ_min × 0.1). */
  get dt(): number {
    return Math.min(this.maxDt, this.model.fastestTimeConstant(this.params) * STEP_FRACTION);
  }
  /** Automatic stop time, s, or undefined to run until stopped. */
  get endTime(): number | undefined {
    return this.endTimeValue;
  }
  get outputs(): O {
    return this.model.outputs(this.t, this.stateVec, this.params);
  }
  /** Recorded samples, oldest first. */
  trace(): Sample[] {
    return this.recorder.toArray();
  }

  // ----- controls (FR-04) --------------------------------------------------

  /** Start from idle, or resume from paused. Ignored when stopped or finished (reset first). */
  start(): void {
    if (this.statusValue === 'idle' || this.statusValue === 'paused') {
      this.statusValue = 'running';
      this.clock = INITIAL_CLOCK;
      this.bump();
    }
  }

  pause(): void {
    if (this.statusValue === 'running') {
      this.statusValue = 'paused';
      this.bump();
    }
  }

  stop(): void {
    if (this.statusValue === 'running' || this.statusValue === 'paused') {
      this.statusValue = 'stopped';
      this.bump();
    }
  }

  /** Back to t = 0 with the current parameters; clears the trace. */
  reset(): void {
    this.t = 0;
    this.stateVec = this.model.init(this.params);
    this.clock = INITIAL_CLOCK;
    this.statusValue = 'idle';
    this.laggingValue = false;
    this.recorder.clear();
    this.lastRecorded = Number.NEGATIVE_INFINITY;
    this.record(true);
    this.bump();
  }

  /**
   * Change parameters. Returns all issues found; when any is an error the change
   * is refused and the model keeps its previous parameters (FR-05). Allowed while
   * running: the state continues from where it is.
   */
  setParams(next: P): Issue[] {
    const issues = this.model.validate(next);
    if (issues.some((i) => i.severity === 'error')) return issues;
    this.params = next;
    if (this.statusValue === 'idle') {
      // Before starting, the initial state follows the parameters.
      this.stateVec = this.model.init(next);
      this.recorder.clear();
      this.lastRecorded = Number.NEGATIVE_INFINITY;
      this.record(true);
    }
    this.bump();
    return issues;
  }

  /** Change the automatic stop time. Only before starting (idle), so a run is never cut short unexpectedly. */
  setEndTime(endTime: number | undefined): void {
    if (this.statusValue !== 'idle')
      throw new Error('The end time can be changed only before starting');
    if (endTime !== undefined && !(endTime > 0)) {
      throw new RangeError(`End time must be positive, got ${endTime}`);
    }
    this.endTimeValue = endTime;
    this.bump();
  }

  setMethod(method: IntegratorName): void {
    this.methodValue = method;
    this.bump();
  }

  setTimeScale(timeScale: number): void {
    if (!(timeScale > 0) || !Number.isFinite(timeScale)) {
      throw new RangeError(`Time scale must be positive, got ${timeScale}`);
    }
    this.timeScaleValue = timeScale;
    this.bump();
  }

  /**
   * Advance by `realElapsed` wall-clock seconds (one animation frame).
   * Returns the number of integration steps taken.
   */
  tick(realElapsed: number): number {
    if (this.statusValue !== 'running') return 0;
    const dt = this.dt;
    const adv = advanceClock(
      this.clock,
      realElapsed,
      this.timeScaleValue,
      dt,
      this.maxStepsPerFrame,
    );
    this.clock = adv.clock;
    this.laggingValue = adv.lagging;
    let taken = 0;
    for (let i = 0; i < adv.steps; i += 1) {
      if (!this.advance(dt)) break;
      taken += 1;
    }
    if (taken > 0 || adv.lagging) this.bump();
    return taken;
  }

  /** Advance simulated time by `duration` regardless of the clock (used by tests and reports). */
  runFor(duration: number): void {
    const dt = this.dt;
    const target = this.t + duration;
    const wasStatus = this.statusValue;
    if (wasStatus === 'idle' || wasStatus === 'paused') this.statusValue = 'running';
    while (this.statusValue === 'running' && target - this.t > dt * 1e-9) {
      if (!this.advance(Math.min(dt, target - this.t))) break;
    }
    if (this.statusValue === 'running')
      this.statusValue = wasStatus === 'idle' ? 'paused' : wasStatus;
    this.bump();
  }

  // ----- internals ------------------------------------------------------

  /** One step of at most `h`; shortens the step to land on the end time. Returns false when finished. */
  private advance(h: number): boolean {
    let hStep = h;
    if (this.endTimeValue !== undefined) {
      const remaining = this.endTimeValue - this.t;
      if (remaining <= h * 1e-9) {
        this.finish();
        return false;
      }
      hStep = Math.min(h, remaining);
    }
    const f = (t: number, s: readonly number[]) =>
      this.model.derivatives(t, s as S, this.params) as readonly number[];
    const next = step(this.methodValue, f, this.t, this.stateVec, hStep) as unknown as S;
    this.stateVec = this.model.project ? this.model.project(next, this.params) : next;
    this.t += hStep;
    this.record(false);
    if (this.endTimeValue !== undefined && this.endTimeValue - this.t <= h * 1e-9) {
      this.t = this.endTimeValue;
      this.finish();
      return false;
    }
    return true;
  }

  private finish(): void {
    this.statusValue = 'finished';
    this.record(true);
    // Signal the change even when the frame took no counted step, so the UI
    // re-renders and leaves the "running" state.
    this.bump();
  }

  private record(force: boolean): void {
    const interval = this.recordInterval ?? 0;
    const last = this.recorder.last();
    if (last && last.t === this.t) return;
    if (!force && this.t - this.lastRecorded < interval - 1e-12) return;
    this.recorder.push({ t: this.t, values: { ...this.outputs } });
    this.lastRecorded = this.t;
  }

  private bump(): void {
    this.version += 1;
  }
}
