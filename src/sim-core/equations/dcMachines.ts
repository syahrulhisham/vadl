/**
 * DC machine equations in the BELK 3423 notation (LN Ch1 Part II p15; Tutorial 1).
 * SI units: V, A, Ω, H, rad/s, N·m, kg·m², N·m·s/rad.
 *
 * Assumptions: linear magnetic circuit (no saturation), no armature reaction,
 * no brush drop. Verification: docs/reference-cases/dc-motor-steady-state.md,
 * dc-drive-converter.md and dc-motor-other.md.
 */

/** Field current from field voltage: If = Vf / Rf. */
export function fieldCurrent(fieldVoltage: number, fieldResistance: number): number {
  return fieldVoltage / fieldResistance;
}

/** Separately excited or shunt back-emf: Eg = Kv·If·ω. Kv [V/(A·rad/s)], If [A], ω [rad/s]. */
export function backEmf(kv: number, ifield: number, omega: number): number {
  return kv * ifield * omega;
}

/** Separately excited or shunt developed torque: Td = Kv·If·Ia [N·m]. */
export function developedTorque(kv: number, ifield: number, ia: number): number {
  return kv * ifield * ia;
}

/**
 * Series motor back-emf with a linear magnetic circuit (flux ∝ Ia): Eg = Kaf·Ia·ω.
 * Kaf [H] is the mutual-inductance constant.
 */
export function seriesBackEmf(kaf: number, ia: number, omega: number): number {
  return kaf * ia * omega;
}

/** Series motor torque with a linear magnetic circuit: Td = Kaf·Ia² [N·m]. */
export function seriesTorque(kaf: number, ia: number): number {
  return kaf * ia * ia;
}

/**
 * Armature circuit: Va = Eg + Ia·R + L·dIa/dt  ⇒  dIa/dt = (Va − Eg − Ia·R)/L.
 * R and L include any series field and starting resistance.
 */
export function armatureCurrentDerivative(
  va: number,
  eg: number,
  ia: number,
  resistance: number,
  inductance: number,
): number {
  return (va - eg - ia * resistance) / inductance;
}

/** Rotor: J·dω/dt = Td − TL − B·ω  ⇒  dω/dt [rad/s²]. */
export function speedDerivative(
  td: number,
  tl: number,
  b: number,
  omega: number,
  inertia: number,
): number {
  return (td - tl - b * omega) / inertia;
}

/** Lowest speed ratio used when k < 0, so the load law stays finite at standstill. */
export const MIN_SPEED_RATIO = 0.01;

/**
 * Course load-torque family (LN Ch1 Part I p11–12): T = C·Tr·(n/nr)^k.
 *   k = 0 constant torque (hoist, pump against constant pressure)
 *   k = 1 torque ∝ speed (generator into fixed resistance)
 *   k = 2 torque ∝ speed² (fans, centrifugal pumps)
 *   k = −1 constant power (milling, boring)
 * Speed is taken as |n|; the torque opposes motion. For k < 0 the ratio n/nr is
 * held at or above MIN_SPEED_RATIO so the torque is finite at standstill.
 */
export function loadTorque(
  c: number,
  tRated: number,
  n: number,
  nRated: number,
  k: number,
): number {
  let ratio = Math.abs(n) / nRated;
  if (k < 0) ratio = Math.max(ratio, MIN_SPEED_RATIO);
  if (k === 0) return c * tRated;
  return c * tRated * ratio ** k;
}

/**
 * Steady state of a separately excited motor with constant field (K = Kv·If):
 *   K·Ia = TL + B·ω,  Va = K·ω + Ra·Ia
 *   ⇒ ω = (Va − Ra·TL/K)/(K + Ra·B/K),  Ia = (TL + B·ω)/K.
 */
export function steadyStateSeparate(
  va: number,
  ra: number,
  k: number,
  tl: number,
  b: number,
): { readonly ia: number; readonly omega: number } {
  const omega = (va - (ra * tl) / k) / (k + (ra * b) / k);
  return { omega, ia: (tl + b * omega) / k };
}

/** Starting current at standstill (Eg = 0): Ia = Va / R. */
export function startingCurrent(va: number, totalResistance: number): number {
  return va / totalResistance;
}

/** Starting resistance that limits the starting current to iaMax: Rst = Va/iaMax − Ra. */
export function startingResistance(va: number, ra: number, iaMax: number): number {
  return va / iaMax - ra;
}

/**
 * Speed after a change of back-emf and flux (Tutorial 1 Q7): N2 = N1·(Eg2/Eg1)·(Φ1/Φ2),
 * from Eg = k·Φ·N.
 */
export function speedFromEmfRatio(
  n1: number,
  eg1: number,
  eg2: number,
  phi1: number,
  phi2: number,
): number {
  return n1 * (eg2 / eg1) * (phi1 / phi2);
}

/** Machine constant kΦ from a back-emf at a speed: kΦ = Eg/ω [V·s/rad]. */
export function machineConstant(eg: number, omega: number): number {
  return eg / omega;
}
