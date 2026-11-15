/**
 * Three-phase induction motor drive. Documentation:
 * docs/simulation-models/m02-induction-motor.md.
 *
 * State vector [ωm (rad/s), θslip (rad)]:
 *   J·dωm/dt = Td(S) − TL − B·ωm,   dθslip/dt = ωs − ωm
 * θslip is the rotor's angle relative to the rotating field (shown in the
 * rotating-field view). Electrical transients are neglected: torque follows the
 * steady-state approximate equivalent circuit at every instant.
 */
import { loadTorque } from '../equations/dcMachines';
import {
  airGapPower,
  circuitAtFrequency,
  inductionTorque,
  inputImpedance,
  maxTorque,
  passiveLoadTorque,
  phaseVoltage,
  rotorCurrent,
  rotorFrequency,
  slip,
  slipAtMaxTorque,
  startingTorque,
  synchronousSpeed,
  synchronousSpeedRpm,
  type ImCircuit,
} from '../equations/inductionMachine';
import type { Issue, SimModel } from '../types';
import { radPerSecToRpm } from '../units';
import type { LoadExponent } from './dcMotor';

/** Speed-control methods taught in the course (LN Ch1 Part IV). */
export type AcControl = 'dol' | 'stator-voltage' | 'rotor-resistance' | 'vf' | 'frequency';

export const AC_CONTROLS: readonly AcControl[] = [
  'dol',
  'stator-voltage',
  'rotor-resistance',
  'vf',
  'frequency',
];

export interface InductionMotorParams {
  readonly control: AcControl;
  readonly poles: number;
  /** Rated line voltage (star connection) [V] and rated frequency [Hz]. */
  readonly ratedLineVoltage: number;
  readonly ratedFrequency: number;
  /** Stator-voltage control factor b = Vs/Vrated (≤ 1). Used only with 'stator-voltage'. */
  readonly voltageFactor: number;
  /** Supply frequency [Hz]. Used with 'vf' and 'frequency'; otherwise the rated frequency. */
  readonly frequency: number;
  /** External rotor resistance, referred to the stator [Ω]. Used only with 'rotor-resistance'. */
  readonly externalRotorResistance: number;
  /** Per-phase circuit at rated frequency [Ω]. */
  readonly rs: number;
  readonly rr: number;
  readonly xs: number;
  readonly xr: number;
  readonly xm: number;
  readonly inertia: number;
  readonly friction: number;
  readonly loadC: number;
  readonly loadRatedTorque: number;
  readonly loadRatedSpeedRpm: number;
  readonly loadExponent: LoadExponent;
}

export interface InductionMotorOutputs extends Readonly<Record<string, number>> {
  readonly speed: number;
  readonly speedRpm: number;
  readonly syncSpeedRpm: number;
  readonly slip: number;
  readonly frequency: number;
  readonly rotorFrequency: number;
  readonly phaseVoltage: number;
  readonly lineVoltage: number;
  readonly torque: number;
  readonly loadTorque: number;
  readonly rotorCurrent: number;
  readonly statorCurrent: number;
  readonly powerFactor: number;
  readonly inputPower: number;
  readonly airGapPower: number;
  readonly statorCopperLoss: number;
  readonly rotorCopperLoss: number;
  readonly developedPower: number;
  readonly outputPower: number;
  readonly efficiency: number;
  readonly maxTorque: number;
  readonly slipAtMaxTorque: number;
  readonly startingTorque: number;
  /** Rotor angle relative to the rotating field, wrapped to 0…2π [rad]. */
  readonly slipAngle: number;
}

export const AC_LIMITS = {
  ratedLineVoltage: { min: 100, max: 700 },
  ratedFrequency: { min: 40, max: 70 },
  voltageFactor: { min: 0.1, max: 1 },
  frequency: { min: 5, max: 200 },
  externalRotorResistance: { min: 0, max: 10 },
  rs: { min: 0, max: 10 },
  rr: { min: 0.01, max: 10 },
  xs: { min: 0.01, max: 20 },
  xr: { min: 0.01, max: 20 },
  xm: { min: 1, max: 200 },
  inertia: { min: 0.005, max: 10 },
  friction: { min: 0, max: 0.5 },
  loadC: { min: 0, max: 2 },
  loadRatedTorque: { min: 0, max: 1000 },
  loadRatedSpeedRpm: { min: 100, max: 6000 },
} as const;

export const AC_POLES: readonly number[] = [2, 4, 6, 8];

/**
 * Presets reproducing the course cases (docs/reference-cases/ac-motor.md).
 * B = 0.00178657 N·m·s/rad represents the 60 W no-load loss of RC-M02-01 at 1750 rpm.
 */
export const AC_PRESETS = {
  performance: {
    control: 'dol',
    poles: 4,
    ratedLineVoltage: 460,
    ratedFrequency: 60,
    voltageFactor: 1,
    frequency: 60,
    externalRotorResistance: 0,
    rs: 0.42,
    rr: 0.23,
    xs: 0.82,
    xr: 0.82,
    xm: 22,
    inertia: 0.1,
    friction: 0.00178657,
    loadC: 1,
    loadRatedTorque: 118.26092,
    loadRatedSpeedRpm: 1750,
    loadExponent: 2,
  },
  statorVoltage: {
    control: 'stator-voltage',
    poles: 4,
    ratedLineVoltage: 460,
    ratedFrequency: 60,
    voltageFactor: 0.519347,
    frequency: 60,
    externalRotorResistance: 0,
    rs: 1.01,
    rr: 0.69,
    xs: 1.3,
    xr: 1.94,
    xm: 43.5,
    inertia: 0.1,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 41,
    loadRatedSpeedRpm: 1740,
    loadExponent: 2,
  },
  rotorResistance: {
    control: 'rotor-resistance',
    poles: 4,
    ratedLineVoltage: 460,
    ratedFrequency: 60,
    voltageFactor: 1,
    frequency: 60,
    externalRotorResistance: 0.23,
    rs: 0.42,
    rr: 0.23,
    xs: 0.82,
    xr: 0.82,
    xm: 22,
    inertia: 0.1,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 118.588,
    loadRatedSpeedRpm: 1700,
    loadExponent: 2,
  },
  vf: {
    control: 'vf',
    poles: 4,
    ratedLineVoltage: 460,
    ratedFrequency: 60,
    voltageFactor: 1,
    frequency: 30,
    externalRotorResistance: 0,
    rs: 0,
    rr: 0.38,
    xs: 1.14,
    xr: 1.71,
    xm: 33.2,
    inertia: 0.1,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 60,
    loadRatedSpeedRpm: 1500,
    loadExponent: 0,
  },
  aboveBase: {
    control: 'frequency',
    poles: 4,
    ratedLineVoltage: 460,
    ratedFrequency: 60,
    voltageFactor: 1,
    frequency: 142.327,
    externalRotorResistance: 0,
    rs: 0,
    rr: 0.38,
    xs: 1.14,
    xr: 1.71,
    xm: 33.2,
    inertia: 0.1,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 10,
    loadRatedSpeedRpm: 4000,
    loadExponent: 0,
  },
} as const satisfies Record<string, InductionMotorParams>;

export type AcPresetName = keyof typeof AC_PRESETS;

/** The supply the motor sees for the selected control method. */
export function acSupply(p: InductionMotorParams): {
  readonly frequency: number;
  readonly phaseVoltage: number;
  readonly circuit: ImCircuit;
  readonly omegaSync: number;
} {
  const variableF = p.control === 'vf' || p.control === 'frequency';
  const frequency = variableF ? p.frequency : p.ratedFrequency;
  const vRated = phaseVoltage(p.ratedLineVoltage);
  const vs =
    p.control === 'stator-voltage'
      ? p.voltageFactor * vRated
      : p.control === 'vf'
        ? vRated * (frequency / p.ratedFrequency)
        : vRated;
  const base = circuitAtFrequency(p, frequency, p.ratedFrequency);
  const circuit =
    p.control === 'rotor-resistance' ? { ...base, rr: base.rr + p.externalRotorResistance } : base;
  return { frequency, phaseVoltage: vs, circuit, omegaSync: synchronousSpeed(frequency, p.poles) };
}

/** Steady-state developed torque at mechanical speed ω for the present supply (characteristic curve). */
export function acTorqueAtSpeed(p: InductionMotorParams, omega: number): number {
  const sup = acSupply(p);
  return inductionTorque(sup.phaseVoltage, sup.omegaSync, sup.circuit, slip(sup.omegaSync, omega));
}

/** Torque the load demands at speed ω ≥ 0: TL(n) + B·ω. */
export function acLoadTorqueAtSpeed(p: InductionMotorParams, omega: number): number {
  return (
    loadTorque(
      p.loadC,
      p.loadRatedTorque,
      radPerSecToRpm(omega),
      p.loadRatedSpeedRpm,
      p.loadExponent,
    ) +
    p.friction * omega
  );
}

function range(
  issues: Issue[],
  key: keyof typeof AC_LIMITS,
  value: number,
  label: string,
  unit: string,
) {
  const lim = AC_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    issues.push({
      parameter: key,
      severity: 'error',
      message: `${label} must be between ${lim.min} and ${lim.max} ${unit}.`,
    });
  }
}

const TWO_PI = 2 * Math.PI;

export const inductionMotorModel: SimModel<InductionMotorParams, InductionMotorOutputs> = {
  id: 'm02.induction-motor',
  modelClass: 'dynamic',
  defaults: AC_PRESETS.performance,
  stateLabels: ['ωm [rad/s]', 'θslip [rad]'],
  assumptions: [
    'Approximate equivalent circuit as taught: the magnetising reactance is moved to the supply terminals and the core-loss resistance is neglected.',
    'Electrical transients are neglected: the torque follows the steady-state circuit at every instant. Only the rotor speed has dynamics.',
    'Balanced sinusoidal three-phase supply, star connected; inverter harmonics are not modelled.',
    'Constant circuit parameters: no saturation or skin effect. Reactances scale in proportion to frequency.',
    'Constant V/f mode has no low-frequency voltage boost, as in the course; at low frequency Rs reduces the available torque.',
    'Rotor-resistance control assumes a wound-rotor machine; the external resistance is given per phase, referred to the stator.',
    'Simplified educational model: it is not a substitute for a full machine or drive simulation.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    if (!AC_POLES.includes(p.poles)) {
      issues.push({
        parameter: 'poles',
        severity: 'error',
        message: 'The number of poles must be 2, 4, 6 or 8.',
      });
    }
    range(issues, 'ratedLineVoltage', p.ratedLineVoltage, 'Rated line voltage', 'V');
    range(issues, 'ratedFrequency', p.ratedFrequency, 'Rated frequency', 'Hz');
    if (p.control === 'stator-voltage')
      range(issues, 'voltageFactor', p.voltageFactor, 'Voltage factor b', '');
    if (p.control === 'vf' || p.control === 'frequency')
      range(issues, 'frequency', p.frequency, 'Supply frequency', 'Hz');
    if (p.control === 'rotor-resistance') {
      range(
        issues,
        'externalRotorResistance',
        p.externalRotorResistance,
        'External rotor resistance',
        'Ω',
      );
    }
    range(issues, 'rs', p.rs, 'Stator resistance Rs', 'Ω');
    range(issues, 'rr', p.rr, "Rotor resistance Rr'", 'Ω');
    range(issues, 'xs', p.xs, 'Stator reactance Xs', 'Ω');
    range(issues, 'xr', p.xr, "Rotor reactance Xr'", 'Ω');
    range(issues, 'xm', p.xm, 'Magnetising reactance Xm', 'Ω');
    range(issues, 'inertia', p.inertia, 'Inertia', 'kg·m²');
    range(issues, 'friction', p.friction, 'Viscous friction', 'N·m·s/rad');
    range(issues, 'loadC', p.loadC, 'Load factor C', '');
    range(issues, 'loadRatedTorque', p.loadRatedTorque, 'Rated load torque', 'N·m');
    range(issues, 'loadRatedSpeedRpm', p.loadRatedSpeedRpm, 'Rated load speed', 'rpm');
    if (![-1, 0, 1, 2].includes(p.loadExponent)) {
      issues.push({
        parameter: 'loadExponent',
        severity: 'error',
        message: 'Load exponent k must be −1, 0, 1 or 2 (the course load families).',
      });
    }
    if (p.control === 'frequency' && issues.length === 0 && p.frequency < p.ratedFrequency) {
      issues.push({
        parameter: 'frequency',
        severity: 'warning',
        message:
          'Constant voltage below rated frequency raises the flux above its rated value; a real motor would saturate and overheat. Use V/f control below base speed.',
      });
    }
    return issues;
  },

  init() {
    return [0, 0];
  },

  derivatives(_t, s, p) {
    const omega = s[0] as number;
    const sup = acSupply(p);
    const td = inductionTorque(
      sup.phaseVoltage,
      sup.omegaSync,
      sup.circuit,
      slip(sup.omegaSync, omega),
    );
    const tl = passiveLoadTorque(
      loadTorque(
        p.loadC,
        p.loadRatedTorque,
        radPerSecToRpm(omega),
        p.loadRatedSpeedRpm,
        p.loadExponent,
      ),
      omega,
      td,
    );
    return [(td - tl - p.friction * omega) / p.inertia, sup.omegaSync - omega];
  },

  project(s) {
    const theta = s[1] as number;
    return [s[0] as number, ((theta % TWO_PI) + TWO_PI) % TWO_PI];
  },

  outputs(_t, s, p) {
    const omega = s[0] as number;
    const sup = acSupply(p);
    const c = sup.circuit;
    const sl = slip(sup.omegaSync, omega);
    const td = inductionTorque(sup.phaseVoltage, sup.omegaSync, c, sl);
    const tl = passiveLoadTorque(
      loadTorque(
        p.loadC,
        p.loadRatedTorque,
        radPerSecToRpm(omega),
        p.loadRatedSpeedRpm,
        p.loadExponent,
      ),
      omega,
      td,
    );
    const ir = rotorCurrent(sup.phaseVoltage, c, sl);
    const zi = inputImpedance(c, sl);
    const is = sup.phaseVoltage / zi.magnitude;
    const pf = Math.cos(zi.angle);
    const pg = airGapPower(sup.phaseVoltage, c, sl);
    const inputPower = 3 * sup.phaseVoltage * is * pf;
    const outputPower = tl * omega;
    return {
      speed: omega,
      speedRpm: radPerSecToRpm(omega),
      syncSpeedRpm: synchronousSpeedRpm(sup.frequency, p.poles),
      slip: sl,
      frequency: sup.frequency,
      rotorFrequency: rotorFrequency(sl, sup.frequency),
      phaseVoltage: sup.phaseVoltage,
      lineVoltage: sup.phaseVoltage * Math.sqrt(3),
      torque: td,
      loadTorque: tl,
      rotorCurrent: ir,
      statorCurrent: is,
      powerFactor: pf,
      inputPower,
      airGapPower: pg,
      statorCopperLoss: 3 * ir * ir * c.rs,
      rotorCopperLoss: sl * pg,
      developedPower: pg * (1 - sl),
      outputPower,
      efficiency: inputPower > 0 && outputPower > 0 ? outputPower / inputPower : 0,
      maxTorque: maxTorque(sup.phaseVoltage, sup.omegaSync, c),
      slipAtMaxTorque: slipAtMaxTorque(c),
      startingTorque: startingTorque(sup.phaseVoltage, sup.omegaSync, c),
      slipAngle: s[1] as number,
    };
  },

  fastestTimeConstant(p) {
    // Steepest torque–speed slope is near synchronous speed: dTd/dω ≈ 3Vs²/(ωs²·Rr').
    const sup = acSupply(p);
    const slope = (3 * sup.phaseVoltage ** 2) / (sup.omegaSync ** 2 * sup.circuit.rr);
    const candidates = [p.inertia / (slope + p.friction)];
    return Math.min(...candidates.filter((x) => Number.isFinite(x) && x > 0), 1);
  },
};
