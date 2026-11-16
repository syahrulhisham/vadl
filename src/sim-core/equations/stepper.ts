/**
 * Stepper motor equations in course notation (LN Ch2 Part I p8, p14–15; Tutorial 3).
 * Angles are in RADIANS inside the core (the course works in degrees; the UI
 * converts at the edge). Pulse rates are in pulses per second.
 * Verification: docs/reference-cases/stepper-motor.md.
 */

const TWO_PI = 2 * Math.PI;

/**
 * Step angle of a variable-reluctance motor, Sa = (Ns − Nr)/(Ns·Nr) × 360°.
 *
 * - Ns: number of stator poles (teeth); Nr: number of rotor teeth.
 * - Returns radians. May be negative or give a non-integer PPR for invalid tooth
 *   counts: check with `stepperGeometryIssue` first.
 * - Source: LN Ch2 Part I p8. Applies to VR motors (L-15).
 */
export function stepAngleFromTeeth(statorTeeth: number, rotorTeeth: number): number {
  return ((statorTeeth - rotorTeeth) / (statorTeeth * rotorTeeth)) * TWO_PI;
}

/** Number of phases of a VR motor, m = Ns/(Ns − Nr) (6/4 → 3, 8/6 → 4). */
export function vrPhaseCount(statorTeeth: number, rotorTeeth: number): number {
  return statorTeeth / (statorTeeth - rotorTeeth);
}

/**
 * Full-step angle of a two-phase hybrid motor from its rotor teeth:
 * Sa = 360°/(4·Nr) [rad]. One tooth pitch (360°/Nr) is covered in four full
 * steps. Nr: rotor teeth. Applies to two-phase hybrids only; the VR formula
 * (stepAngleFromTeeth) does not apply to a hybrid (L-15). Extension: the course
 * gives hybrid motors by their step angle. Verification: RC-M04-06.
 */
export function hybridStepAngle(rotorTeeth: number): number {
  return TWO_PI / (4 * rotorTeeth);
}

/** Full steps per revolution of a two-phase hybrid, 4·Nr. Verification: RC-M04-06. */
export function hybridStepsPerRev(rotorTeeth: number): number {
  return 4 * rotorTeeth;
}

/** Rotor teeth of a two-phase hybrid with the given full steps per revolution, steps/4. */
export function hybridRotorTeeth(stepsPerRev: number): number {
  return stepsPerRev / 4;
}

/** Step angle from steps (pulses) per revolution, Sa = 360°/PPR [rad]. */
export function stepAngleFromSteps(stepsPerRev: number): number {
  return TWO_PI / stepsPerRev;
}

/** Pulses per revolution, PPR = 360°/Sa (Sa in rad). */
export function pulsesPerRevolution(stepAngle: number): number {
  return TWO_PI / stepAngle;
}

/**
 * Shaft speed N = Sa·PR·60/360 = Sa·PR/6 (Sa in degrees, N in rpm). Here in SI:
 * ω = Sa·PR [rad/s] with Sa in rad and PR in pulses/s.
 */
export function stepperSpeed(stepAngle: number, pulseRate: number): number {
  return stepAngle * pulseRate;
}

/** Pulse rate for a required speed, PR = ω/Sa [pulses/s] (course: PR = 6N/Sa). */
export function pulseRateForSpeed(stepAngle: number, omega: number): number {
  return omega / stepAngle;
}

/** Time between pulses, 1/PR [s]. */
export function stepTime(pulseRate: number): number {
  return 1 / pulseRate;
}

/** Pulses needed to turn through an angle, angle/Sa (both in rad). */
export function pulsesForAngle(angle: number, stepAngle: number): number {
  return angle / stepAngle;
}

/**
 * Reason a VR tooth combination is not a valid motor, or null when it is.
 * Course requirements (course-alignment §5.4): Ns ≠ Nr, Sa > 0, integer PPR,
 * and an integer number of phases with the stator poles shared equally.
 */
export function stepperGeometryIssue(statorTeeth: number, rotorTeeth: number): string | null {
  if (!Number.isInteger(statorTeeth) || !Number.isInteger(rotorTeeth) || rotorTeeth < 2) {
    return 'Tooth counts must be whole numbers, with at least 2 rotor teeth.';
  }
  if (statorTeeth === rotorTeeth) {
    return 'Ns = Nr gives Sa = 0: the rotor would have no preferred step position. Stator and rotor tooth counts are never equal.';
  }
  if (statorTeeth < rotorTeeth) {
    return 'Ns < Nr gives a negative step angle with the course formula. Enter the stator pole count as Ns (it is the larger number on a VR motor).';
  }
  const ppr = (statorTeeth * rotorTeeth) / (statorTeeth - rotorTeeth);
  if (Math.abs(ppr - Math.round(ppr)) > 1e-9) {
    return `PPR = 360°/Sa = ${ppr.toFixed(3)} is not a whole number: the motor could not return to the same position after one revolution.`;
  }
  const m = statorTeeth / (statorTeeth - rotorTeeth);
  if (Math.abs(m - Math.round(m)) > 1e-9 || m < 2 || m > 5) {
    return `This combination gives m = Ns/(Ns − Nr) = ${Number(m.toFixed(3))} phases; VADL draws motors with 2 to 5 phases.`;
  }
  return null;
}

/** Drive modes as taught (wave, normal = two-phase-on, half step) plus microstepping (extension). */
export type StepMode = 'wave' | 'normal' | 'half' | 'micro';

/** Motor family: variable reluctance (m phases), or two-phase permanent magnet / hybrid. */
export type StepperFamily = 'vr' | 'pm' | 'hybrid';

/**
 * Phase currents for a step index k (normalised: 1 = rated current).
 *
 * - VR motors (m phases, unipolar): wave = phase k; normal = phases k and k+1;
 *   half = alternately one and two phases.
 * - Two-phase PM/hybrid (bipolar): currents [iA, iB] following
 *   A+, B+, A−, B− (wave); A+B+, A−B+, A−B−, A+B− (normal); the eight half
 *   steps; microstepping iA = cos(k·90°/n), iB = sin(k·90°/n).
 * - Negative k is the reverse (anticlockwise) sequence.
 * Source: LN Ch2 Part I p30–37, p40–43.
 */
export function phaseCurrents(
  family: StepperFamily,
  phases: number,
  mode: StepMode,
  k: number,
  microsteps = 16,
): number[] {
  const mod = (a: number, n: number) => ((a % n) + n) % n;
  if (family === 'vr') {
    const i = Array.from({ length: phases }, () => 0);
    if (mode === 'wave') i[mod(k, phases)] = 1;
    else if (mode === 'normal') {
      i[mod(k, phases)] = 1;
      i[mod(k + 1, phases)] = 1;
    } else {
      // half step (microstepping is not offered for VR motors)
      const h = mod(k, 2 * phases);
      i[Math.floor(h / 2)] = 1;
      if (h % 2 === 1) i[mod(Math.floor(h / 2) + 1, phases)] = 1;
    }
    return i;
  }
  // Two-phase bipolar: electrical angle of the current vector.
  const quarter = Math.PI / 2;
  let angle: number;
  if (mode === 'wave') angle = k * quarter;
  else if (mode === 'normal') angle = k * quarter + quarter / 2;
  else if (mode === 'half') angle = (k * quarter) / 2;
  else angle = (k * quarter) / microsteps;
  if (mode === 'micro') return [clean(Math.cos(angle)), clean(Math.sin(angle))];
  // Full and half steps switch whole currents: sign of cos/sin (normal: both on).
  return [Math.sign(clean(Math.cos(angle))), Math.sign(clean(Math.sin(angle)))];
}

function clean(v: number): number {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

/** Fraction of a full step moved per pulse: 1 (wave, normal), ½ (half), 1/n (micro). */
export function stepFraction(mode: StepMode, microsteps = 16): number {
  if (mode === 'half') return 0.5;
  if (mode === 'micro') return 1 / microsteps;
  return 1;
}

/**
 * Rotor equilibrium (detent) angle for step index k with no load [rad]:
 * k·Sa·fraction, plus Sa/2 in normal (two-phase-on) mode, where the rotor sits
 * midway between two phases (LN Ch2 Part I lab tables: AB at 15° for Sa = 30°).
 */
export function equilibriumAngle(
  fullStepAngle: number,
  mode: StepMode,
  k: number,
  microsteps = 16,
): number {
  const base = k * fullStepAngle * stepFraction(mode, microsteps);
  return mode === 'normal' ? base + fullStepAngle / 2 : base;
}

/**
 * Electrical cycles per revolution Ne: the torque–angle law repeats every 1/Ne turn.
 * VR: Ne = Nr (one rotor tooth pitch). Two-phase bipolar: four full steps per
 * electrical cycle, Ne = 360°/(4·Sa) (1.8° hybrid → 50).
 */
export function electricalCycles(
  family: StepperFamily,
  fullStepAngle: number,
  phases: number,
): number {
  return family === 'vr' ? TWO_PI / (phases * fullStepAngle) : TWO_PI / (4 * fullStepAngle);
}

/**
 * Motor torque at rotor angle θ for the given phase currents [N·m]:
 *
 *   T = −Tpk · Σ g(i_j) · sin(Ne·θ − ψ_j)
 *
 * - Tpk: peak (holding) torque of one phase at rated current [N·m].
 * - ψ_j: electrical position of phase j: VR j·2π/m; two-phase A 0, B π/2.
 * - g(i) = i for bipolar windings (the sign reverses the pole); g(i) = i² for VR
 *   (reluctance torque does not depend on current direction).
 * - Assumes a sinusoidal torque–angle curve, no saturation, ideal current drive.
 * Linearised stiffness at equilibrium (one phase): dT/dθ = −Ne·Tpk.
 */
export function stepperTorque(
  family: StepperFamily,
  currents: readonly number[],
  theta: number,
  ne: number,
  peakTorque: number,
): number {
  let t = 0;
  const m = currents.length;
  currents.forEach((i, j) => {
    const psi = family === 'vr' ? (j * TWO_PI) / m : (j * Math.PI) / 2;
    const g = family === 'vr' ? i * i : i;
    t += g * Math.sin(ne * theta - psi);
  });
  return -peakTorque * t;
}
