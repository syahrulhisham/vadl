/**
 * Three-phase induction machine, course approximate equivalent circuit
 * ("AC Drives new" p10–17): the magnetising reactance Xm is moved to the supply
 * terminals; Rm is neglected; Vs is the PER-PHASE voltage; ωs is the MECHANICAL
 * synchronous speed. SI units. Verification: docs/reference-cases/ac-motor.md.
 */

/** Per-phase circuit parameters at the operating frequency [Ω]. */
export interface ImCircuit {
  readonly rs: number;
  readonly rr: number;
  readonly xs: number;
  readonly xr: number;
  readonly xm: number;
}

/** Synchronous speed Ns = 120f/p [rpm]. */
export function synchronousSpeedRpm(frequency: number, poles: number): number {
  return (120 * frequency) / poles;
}

/** Mechanical synchronous speed ωs = 2ω/p = 4πf/p [rad/s]. */
export function synchronousSpeed(frequency: number, poles: number): number {
  return (4 * Math.PI * frequency) / poles;
}

/** Slip S = (ωs − ωm)/ωs (motoring 0…1, regenerating < 0, plugging > 1). */
export function slip(omegaSync: number, omegaMech: number): number {
  return (omegaSync - omegaMech) / omegaSync;
}

/** Rotor frequency fr = S·f [Hz]. */
export function rotorFrequency(s: number, frequency: number): number {
  return s * frequency;
}

/** Reactances scale with frequency: X = X_rated·(f/f_rated). Resistances do not. */
export function circuitAtFrequency(
  rated: ImCircuit,
  frequency: number,
  ratedFrequency: number,
): ImCircuit {
  const k = frequency / ratedFrequency;
  return { rs: rated.rs, rr: rated.rr, xs: rated.xs * k, xr: rated.xr * k, xm: rated.xm * k };
}

/** Referred rotor current magnitude Ir' = Vs/√[(Rs + Rr'/S)² + (Xs + Xr')²]; 0 at S = 0. */
export function rotorCurrent(vs: number, c: ImCircuit, s: number): number {
  if (s === 0) return 0;
  return vs / Math.hypot(c.rs + c.rr / s, c.xs + c.xr);
}

/**
 * Input impedance Zi = jXm ∥ (Rs + Rr'/S + j(Xs + Xr')) as magnitude [Ω] and angle [rad].
 * At S = 0 the rotor branch is open and Zi = jXm.
 */
export function inputImpedance(
  c: ImCircuit,
  s: number,
): { readonly magnitude: number; readonly angle: number } {
  if (s === 0) return { magnitude: c.xm, angle: Math.PI / 2 };
  const a = c.rs + c.rr / s; // rotor branch real part
  const b = c.xs + c.xr; // rotor branch imaginary part
  // Z = (a + jb)(jXm) / (a + j(b + Xm))
  const numRe = -b * c.xm;
  const numIm = a * c.xm;
  const denRe = a;
  const denIm = b + c.xm;
  const den = denRe * denRe + denIm * denIm;
  const re = (numRe * denRe + numIm * denIm) / den;
  const im = (numIm * denRe - numRe * denIm) / den;
  return { magnitude: Math.hypot(re, im), angle: Math.atan2(im, re) };
}

/** Air-gap power Pg = 3·Ir'²·Rr'/S [W] (negative when regenerating). */
export function airGapPower(vs: number, c: ImCircuit, s: number): number {
  if (s === 0) return 0;
  const ir = rotorCurrent(vs, c, s);
  return (3 * ir * ir * c.rr) / s;
}

/**
 * Developed torque Td = Pg/ωs = 3Rr'Vs² / {S·ωs·[(Rs + Rr'/S)² + (Xs + Xr')²]} [N·m].
 */
export function inductionTorque(vs: number, omegaSync: number, c: ImCircuit, s: number): number {
  return airGapPower(vs, c, s) / omegaSync;
}

/** Slip at maximum torque Smax = Rr'/√[Rs² + (Xs + Xr')²] (motoring). */
export function slipAtMaxTorque(c: ImCircuit): number {
  return c.rr / Math.hypot(c.rs, c.xs + c.xr);
}

/** Maximum (breakdown) torque Tmax = 3Vs² / {2ωs[Rs + √(Rs² + (Xs + Xr')²)]} [N·m]. */
export function maxTorque(vs: number, omegaSync: number, c: ImCircuit): number {
  return (3 * vs * vs) / (2 * omegaSync * (c.rs + Math.hypot(c.rs, c.xs + c.xr)));
}

/** Starting torque (S = 1) Tst = 3Rr'Vs² / {ωs[(Rs + Rr')² + (Xs + Xr')²]} [N·m]. */
export function startingTorque(vs: number, omegaSync: number, c: ImCircuit): number {
  return inductionTorque(vs, omegaSync, c, 1);
}

/** Phase voltage of a star-connected supply from the line voltage: Vph = VL/√3. */
export function phaseVoltage(lineVoltage: number): number {
  return lineVoltage / Math.sqrt(3);
}

/**
 * Passive load acting on a shaft: opposes motion; at standstill it balances any
 * driving torque up to its own value, so it never drives the shaft backwards.
 */
export function passiveLoadTorque(tl: number, omega: number, driving: number): number {
  if (omega > 0) return tl;
  if (omega < 0) return -tl;
  return Math.max(-tl, Math.min(tl, driving));
}
