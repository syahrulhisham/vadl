/**
 * Core contracts of the simulation layer (docs/architecture.md, "Simulation core contract").
 *
 * Layer rule: nothing in src/sim-core imports React, the DOM or any layer above it.
 * Units rule: every number crossing these interfaces is in SI units (rad/s, N·m, A,
 * V, Pa, m³/s, m, s). Conversion to display units happens only in sim-core/units.
 */

/** Severity of a parameter-validation finding. `error` blocks the simulation from running. */
export type IssueSeverity = 'error' | 'warning';

/**
 * A finding returned by `validate`. The message must explain the problem in
 * engineering terms (FR-05), for example "Inertia J must be greater than zero:
 * with J = 0 the rotor would accelerate instantaneously."
 */
export interface Issue {
  /** Key of the offending parameter, or `null` when the issue concerns a combination. */
  readonly parameter: string | null;
  readonly severity: IssueSeverity;
  readonly message: string;
}

/** The three model classes in docs/architecture.md. */
export type ModelClass = 'dynamic' | 'static' | 'logic';

/** Fields shared by every model class. */
interface ModelBase<P> {
  /** Stable identifier, for example `dc-motor.separately-excited`. */
  readonly id: string;
  readonly modelClass: ModelClass;
  /** Default parameters in SI units. */
  readonly defaults: P;
  /** Range and consistency checks. An empty array means the parameters are valid. */
  validate(p: P): Issue[];
  /** Plain-language assumptions and limitations, shown beside the simulation and in reports (FR-14). */
  readonly assumptions: readonly string[];
}

/**
 * A dynamic model expressed as state equations dS/dt = f(t, S, P).
 *
 * The state `S` is a fixed-length numeric vector so the generic integrators in
 * sim-core/engine (Euler, RK4) can advance any model without knowing its meaning.
 */
export interface SimModel<P, O, S extends readonly number[] = number[]> extends ModelBase<P> {
  readonly modelClass: 'dynamic';
  /** Names of the state variables, in vector order, with units, e.g. `['Ia [A]', 'ω [rad/s]']`. */
  readonly stateLabels: readonly string[];
  /** Initial state vector. */
  init(p: P): S;
  /** Time derivative of the state vector: the state equations. */
  derivatives(t: number, s: S, p: P): S;
  /** Measurements derived from the state (all SI). */
  outputs(t: number, s: S, p: P): O;
  /**
   * The fastest time constant of the model for these parameters, in seconds.
   * The engine keeps the step at or below one tenth of it (plan section 5, step-size rule).
   */
  fastestTimeConstant(p: P): number;
}

/** An algebraic steady-state model (mechanical transmission, converter averages). */
export interface StaticModel<P, O> extends ModelBase<P> {
  readonly modelClass: 'static';
  outputs(p: P): O;
}

/** A discrete-event model (valves, relay ladders, step sequences), advanced one scan at a time. */
export interface LogicModel<P, I, S, O> extends ModelBase<P> {
  readonly modelClass: 'logic';
  init(p: P): S;
  /** One scan: new state from the current state and inputs. Must be a pure function. */
  step(inputs: I, state: S, p: P): S;
  outputs(state: S, p: P): O;
}

/** A single measured or computed quantity, in SI units, as produced by a model. */
export interface Measurement {
  /** Key matching a measurement definition, e.g. `armatureCurrent`. */
  readonly key: string;
  /** Value in the SI unit of its quantity. */
  readonly value: number;
  /** Simulation time at which the value was produced, in seconds. */
  readonly time: number;
}
