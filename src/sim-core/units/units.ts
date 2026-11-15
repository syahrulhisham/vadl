/**
 * Unit conversions between SI (used everywhere inside sim-core) and the display
 * units students read on screen. This is the only place such conversions live.
 *
 * Every factor below is exact by definition, so no tolerance is introduced here:
 *   1 rev = 2π rad, 1 min = 60 s       → n [rpm] = ω [rad/s] × 60 / (2π)
 *   1 bar = 100 000 Pa (exact)
 *   1 L = 1 × 10⁻³ m³, 1 min = 60 s    → Q [m³/s] = Q [L/min] / 60 000
 *   1 mm = 1 × 10⁻³ m
 *   1° = π / 180 rad
 *
 * Pressures are handled as gauge or absolute exactly as given; these functions
 * never add atmospheric pressure. The caller states which it is.
 */

const TWO_PI = 2 * Math.PI;

/** Pascals in one bar (exact). */
export const PA_PER_BAR = 100_000;

/** L/min in one m³/s (exact): 1000 L/m³ × 60 s/min. */
export const LPM_PER_M3S = 60_000;

/** Angular velocity: rad/s → rpm. */
export function radPerSecToRpm(omega: number): number {
  return (omega * 60) / TWO_PI;
}

/** Angular velocity: rpm → rad/s. */
export function rpmToRadPerSec(n: number): number {
  return (n * TWO_PI) / 60;
}

/** Pressure: bar → Pa. */
export function barToPa(p: number): number {
  return p * PA_PER_BAR;
}

/** Pressure: Pa → bar. */
export function paToBar(p: number): number {
  return p / PA_PER_BAR;
}

/** Area: cm² → m² (hydraulics labs quote areas in cm²). */
export function cm2ToM2(a: number): number {
  return a * 1e-4;
}

/** Volume: cm³ → m³ (pump displacement per revolution). */
export function cm3ToM3(v: number): number {
  return v * 1e-6;
}

/** Pressure: MPa → Pa (hydraulics labs use MPa). */
export function mpaToPa(p: number): number {
  return p * 1e6;
}

/** Pressure: Pa → MPa. */
export function paToMpa(p: number): number {
  return p / 1e6;
}

/** Volumetric flow: L/min → m³/s. */
export function litresPerMinToCubicMetresPerSec(q: number): number {
  return q / LPM_PER_M3S;
}

/** Volumetric flow: m³/s → L/min. */
export function cubicMetresPerSecToLitresPerMin(q: number): number {
  return q * LPM_PER_M3S;
}

/** Length: mm → m. */
export function mmToM(x: number): number {
  return x / 1000;
}

/** Length: m → mm. */
export function mToMm(x: number): number {
  return x * 1000;
}

/** Angle: degrees → radians. */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Angle: radians → degrees. */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Format a value to a fixed number of significant figures for display (FR-06).
 * Returns plain decimal notation for magnitudes in [1e-3, 1e6) and engineering-
 * style exponent notation otherwise. Non-finite values are shown as an em dash
 * so that a failed calculation is never displayed as a plausible number.
 */
export function formatSignificant(value: number, sigFigs = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (!Number.isInteger(sigFigs) || sigFigs < 1 || sigFigs > 15) {
    throw new RangeError(`sigFigs must be an integer from 1 to 15, got ${sigFigs}`);
  }
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e6) {
    // toPrecision may switch to exponent form near the edges; Number() normalises it.
    return String(Number(value.toPrecision(sigFigs)));
  }
  return value.toExponential(sigFigs - 1);
}

/**
 * Replace numerical residue by exact zero: |v| < floor → 0. A settled
 * integration leaves values such as 6e−13 rad or cos 90° = 6e−17 that are
 * rounding noise, far below any physical resolution. The default floor (1e−9 in
 * the SI unit of the quantity) is below every meaningful value in VADL.
 */
export function cleanResidue(value: number, floor = 1e-9): number {
  return Math.abs(value) < floor ? 0 : value;
}
