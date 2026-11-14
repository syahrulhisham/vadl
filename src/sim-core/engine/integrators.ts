/**
 * Fixed-step numerical integrators for state equations dS/dt = f(t, S).
 *
 * - Forward Euler: S(t+h) = S + h·f(t, S). First order: global error ∝ h.
 * - Classical fourth-order Runge–Kutta (RK4): global error ∝ h⁴.
 *
 * Both are generic over a numeric state vector, so one implementation serves
 * every dynamic model. RK4 is the default (plan §5); Euler is kept so students
 * can compare the methods.
 */

export type IntegratorName = 'euler' | 'rk4';

export const INTEGRATORS: readonly IntegratorName[] = ['euler', 'rk4'];

/** Time derivative of a state vector. Must not mutate `s`. */
export type Derivative = (t: number, s: readonly number[]) => readonly number[];

function axpy(s: readonly number[], h: number, k: readonly number[]): number[] {
  if (k.length !== s.length) {
    throw new Error(`Derivative length ${k.length} does not match state length ${s.length}`);
  }
  return s.map((v, i) => v + h * (k[i] as number));
}

/** One forward-Euler step of size h. */
export function eulerStep(f: Derivative, t: number, s: readonly number[], h: number): number[] {
  return axpy(s, h, f(t, s));
}

/** One classical RK4 step of size h. */
export function rk4Step(f: Derivative, t: number, s: readonly number[], h: number): number[] {
  const k1 = f(t, s);
  const k2 = f(t + h / 2, axpy(s, h / 2, k1));
  const k3 = f(t + h / 2, axpy(s, h / 2, k2));
  const k4 = f(t + h, axpy(s, h, k3));
  return s.map(
    (v, i) =>
      v +
      (h / 6) *
        ((k1[i] as number) + 2 * (k2[i] as number) + 2 * (k3[i] as number) + (k4[i] as number)),
  );
}

/** Advance one step with the named method. */
export function step(
  method: IntegratorName,
  f: Derivative,
  t: number,
  s: readonly number[],
  h: number,
): number[] {
  if (!(h > 0) || !Number.isFinite(h)) throw new RangeError(`Step size must be positive, got ${h}`);
  return method === 'rk4' ? rk4Step(f, t, s, h) : eulerStep(f, t, s, h);
}

/**
 * Integrate from t0 to tEnd with a fixed step, landing exactly on tEnd (the last
 * step is shortened if needed). Returns the final state. Used by tests and by
 * report regeneration; live simulations use the runner.
 */
export function integrate(
  method: IntegratorName,
  f: Derivative,
  s0: readonly number[],
  t0: number,
  tEnd: number,
  h: number,
): number[] {
  if (tEnd < t0) throw new RangeError('tEnd must not be before t0');
  let t = t0;
  let s = [...s0];
  // Tolerance stops a final sliver step caused by floating-point accumulation.
  const eps = h * 1e-9;
  while (tEnd - t > eps) {
    const hStep = Math.min(h, tEnd - t);
    s = step(method, f, t, s, hStep);
    t += hStep;
  }
  return s;
}
