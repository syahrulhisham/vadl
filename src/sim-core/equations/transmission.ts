/**
 * Mechanical transmission in course notation (LN Ch3 Parts I–II, Tutorial 4).
 * Convention (stated once, L-9): G = T_driven/T_driver for gears and sprockets,
 * G = D_driven/D_driver for belt pulleys; N_out = N_in/G; G > 1 is a reduction.
 * Directions: +1 clockwise, −1 anticlockwise. SI units for torque, force, speed.
 * Verification: docs/reference-cases/transmission.md.
 */

/** Kind of stage between two shafts. */
export type DriveKind = 'gear' | 'belt-open' | 'belt-crossed' | 'chain';

/** Stage ratio G = size_driven/size_driver (teeth or diameters). */
export function stageRatio(driver: number, driven: number): number {
  return driven / driver;
}

/** Output speed N_out = N_in/G (any speed unit; sign carries direction). */
export function outputSpeed(inputSpeed: number, ratio: number): number {
  return inputSpeed / ratio;
}

/**
 * Direction factor of a stage: an external gear mesh reverses (−1), and each
 * idler adds a further reversal; an open belt or a chain keeps the direction (+1);
 * a crossed belt reverses (−1). Source: Tutorial 4 Q4, LN Ch3 Part I p11–12.
 */
export function stageDirection(kind: DriveKind, idlers = 0): number {
  if (kind === 'gear') return idlers % 2 === 0 ? -1 : 1;
  return kind === 'belt-crossed' ? -1 : 1;
}

/**
 * Output torque through a stage or train, T_out = η·G·T_in [N·m].
 * Extension: the course states only that speed down means torque up.
 */
export function outputTorque(inputTorque: number, ratio: number, efficiency = 1): number {
  return efficiency * ratio * inputTorque;
}

/** Belt torque on a pulley of radius r from the tight and slack tensions, (T1 − T2)·r [N·m]. */
export function beltTorque(tight: number, slack: number, radius: number): number {
  return (tight - slack) * radius;
}

/** Belt (rim) speed v = ω·r [m/s]. */
export function beltSpeed(omega: number, radius: number): number {
  return omega * radius;
}

/** Power transmitted by a belt, P = (T1 − T2)·v [W]. */
export function beltPower(tight: number, slack: number, speed: number): number {
  return (tight - slack) * speed;
}

/** Mechanical advantage MA = load/effort. */
export function mechanicalAdvantage(load: number, effort: number): number {
  return load / effort;
}

/** Velocity ratio VR = distance moved by effort / distance moved by load. */
export function velocityRatio(effortDistance: number, loadDistance: number): number {
  return effortDistance / loadDistance;
}

/** Efficiency η = MA/VR (fraction). */
export function machineEfficiency(ma: number, vr: number): number {
  return ma / vr;
}

/**
 * Lifting pulley with n supporting rope segments: VR = n, ideal MA = n,
 * effort = load/(n·η), effort distance = n·h. η < 1 is an extension (L-20).
 */
export function liftingPulley(supports: number, load: number, height: number, efficiency = 1) {
  const effort = load / (supports * efficiency);
  return {
    velocityRatio: supports,
    effort,
    mechanicalAdvantage: mechanicalAdvantage(load, effort),
    effortDistance: supports * height,
  };
}
