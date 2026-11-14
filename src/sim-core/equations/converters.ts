/**
 * Average output voltage of phase-controlled converters (course LN Ch1 Part II
 * p21–30, Part III p6–11). SI units; angles in radians.
 *
 * Assumptions (stated in the laboratory): ideal thyristors and diodes, no
 * source inductance (no overlap), continuous load current. Single-phase Vm is
 * the peak supply voltage √2·Vrms; three-phase Vm is the peak PHASE voltage.
 * Verification: docs/reference-cases/dc-converter-voltages.md (RC-M01-04).
 */

export type ConverterKind =
  | 'single-half'
  | 'single-semi'
  | 'single-full'
  | 'single-dual'
  | 'three-half'
  | 'three-semi'
  | 'three-full'
  | 'three-dual';

export const CONVERTER_KINDS: readonly ConverterKind[] = [
  'single-half',
  'single-semi',
  'single-full',
  'single-dual',
  'three-half',
  'three-semi',
  'three-full',
  'three-dual',
];

/** Peak of a sinusoid from its rms value: Vm = √2·Vrms. */
export function peakFromRms(vRms: number): number {
  return Math.SQRT2 * vRms;
}

/** Peak phase voltage of a balanced three-phase supply from the rms line voltage: √2·VLL/√3. */
export function peakPhaseFromLine(vLineRms: number): number {
  return (Math.SQRT2 * vLineRms) / Math.sqrt(3);
}

export function isThreePhase(kind: ConverterKind): boolean {
  return kind.startsWith('three');
}

/** Peak voltage Vm used in the course formula, from the rms supply (phase-to-neutral for 1-φ, line for 3-φ). */
export function converterPeak(kind: ConverterKind, supplyRms: number): number {
  return isThreePhase(kind) ? peakPhaseFromLine(supplyRms) : peakFromRms(supplyRms);
}

/**
 * Average DC output voltage.
 *   1-φ half-wave: (Vm/2π)(1 + cos α)    1-φ semi: (Vm/π)(1 + cos α)    1-φ full/dual: (2Vm/π)cos α
 *   3-φ half-wave: (3√3·Vm/2π)cos α      3-φ semi: (3√3·Vm/2π)(1 + cos α)
 *   3-φ full/dual: (3√3·Vm/π)cos α
 * For a dual converter this is converter 1; see `dualConverter2Voltage`.
 * @param vPeak Vm [V]   @param alpha firing angle α [rad], 0…π
 * @returns average output [V]
 */
export function converterAverageVoltage(kind: ConverterKind, vPeak: number, alpha: number): number {
  const c = Math.cos(alpha);
  const k3 = (3 * Math.sqrt(3) * vPeak) / Math.PI;
  switch (kind) {
    case 'single-half':
      return (vPeak / (2 * Math.PI)) * (1 + c);
    case 'single-semi':
      return (vPeak / Math.PI) * (1 + c);
    case 'single-full':
    case 'single-dual':
      return ((2 * vPeak) / Math.PI) * c;
    case 'three-half':
      return (k3 / 2) * c;
    case 'three-semi':
      return (k3 / 2) * (1 + c);
    case 'three-full':
    case 'three-dual':
      return k3 * c;
  }
}

/**
 * Converter 2 of a dual converter, which conducts reverse current:
 *   Va = −(2Vm/π)·cos α2 (1-φ) or −(3√3·Vm/π)·cos α2 (3-φ).
 * The slides omit the minus sign (course-alignment §7); with α1 + α2 = π both
 * converters give the same average voltage.
 */
export function dualConverter2Voltage(
  kind: 'single-dual' | 'three-dual',
  vPeak: number,
  alpha2: number,
): number {
  return -converterAverageVoltage(kind, vPeak, alpha2);
}

/** Only a dual converter can carry armature current in both directions. */
export function canReverseCurrent(kind: ConverterKind): boolean {
  return kind === 'single-dual' || kind === 'three-dual';
}

/** Full and dual converters can produce a negative average voltage (inversion, α > 90°). */
export function canReverseVoltage(kind: ConverterKind): boolean {
  return kind.endsWith('full') || kind.endsWith('dual') || kind === 'three-half';
}
