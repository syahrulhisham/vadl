/**
 * Circuit equations. SI units throughout.
 * Reference: docs/simulation-models/engine-rl-circuit.md; verification:
 * docs/reference-cases/rl-circuit-step.md (RC-ENG-01).
 */

/**
 * Time constant of a series RL circuit.
 *   τ = L / R
 * @param inductance L [H], > 0
 * @param resistance R [Ω], > 0
 * @returns τ [s]
 */
export function rlTimeConstant(inductance: number, resistance: number): number {
  return inductance / resistance;
}

/**
 * Rate of change of current in a series RL circuit (Kirchhoff's voltage law).
 *   L·di/dt = V − R·i   ⇒   di/dt = (V − R·i) / L
 * Same form as the DC armature equation Va = Eg + Ia·Ra + La·dIa/dt with Eg = 0.
 * @param voltage V [V]
 * @param resistance R [Ω]
 * @param inductance L [H], > 0
 * @param current i [A]
 * @returns di/dt [A/s]
 */
export function rlCurrentDerivative(
  voltage: number,
  resistance: number,
  inductance: number,
  current: number,
): number {
  return (voltage - resistance * current) / inductance;
}

/**
 * Analytic step response of a series RL circuit from i(0) = i0.
 *   i(t) = V/R + (i0 − V/R)·e^(−t/τ)
 * Assumes constant V, R, L. Used to verify the numerical integrators.
 * @returns i(t) [A]
 */
export function rlStepResponse(
  voltage: number,
  resistance: number,
  inductance: number,
  t: number,
  i0 = 0,
): number {
  const iFinal = voltage / resistance;
  return iFinal + (i0 - iFinal) * Math.exp(-t / rlTimeConstant(inductance, resistance));
}
