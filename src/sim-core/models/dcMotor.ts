/**
 * Dynamic DC motor model: separately excited, shunt and series machines fed
 * from a DC supply or from average-value controlled converters.
 * Documentation: docs/simulation-models/m01-dc-motor.md.
 *
 * State vector [Ia (A), ω (rad/s)]:
 *   (Ra + Rst [+ Rs])·Ia + (La [+ Ls])·dIa/dt = Va − Eg
 *   J·dω/dt = Td − TL − B·ω
 * Separately excited / shunt: Eg = Kv·If·ω, Td = Kv·If·Ia.
 * Series (linear magnetic circuit): Eg = Kaf·Ia·ω, Td = Kaf·Ia².
 * At steady state these reduce to the course's equations
 * (Eg = Va − Ia·Ra, Td = Kv·If·Ia), verified by RC-M01-01 and RC-M01-02.
 */
import {
  canReverseCurrent,
  converterAverageVoltage,
  converterPeak,
  type ConverterKind,
} from '../equations/converters';
import {
  armatureCurrentDerivative,
  backEmf,
  developedTorque,
  fieldCurrent,
  loadTorque,
  seriesBackEmf,
  seriesTorque,
  speedDerivative,
} from '../equations/dcMachines';
import type { Issue, SimModel } from '../types';
import { radPerSecToRpm } from '../units';

export type MotorType = 'separately-excited' | 'shunt' | 'series';
export type SupplyMode = 'dc' | 'converter';
export type LoadExponent = -1 | 0 | 1 | 2;

export interface DcMotorParams {
  readonly motorType: MotorType;
  readonly supply: SupplyMode;
  /** DC supply: armature terminal voltage Va [V]. */
  readonly armatureVoltage: number;
  /** DC supply, separately excited: field voltage Vf [V]. */
  readonly fieldVoltage: number;
  /** Converter supply: rms supply voltage (phase for 1-φ, line for 3-φ) [V]. */
  readonly supplyRms: number;
  readonly armatureConverter: ConverterKind;
  /** Armature firing angle αa [rad]. */
  readonly alphaArmature: number;
  /** Separately excited on a converter supply: field converter. */
  readonly fieldConverter: ConverterKind;
  /** Field firing angle αf [rad]. */
  readonly alphaField: number;
  /** Armature resistance Ra [Ω] and inductance La [H]. */
  readonly ra: number;
  readonly la: number;
  /** Shunt or separate field resistance Rf [Ω]. */
  readonly rf: number;
  /** Motor constant Kv [V/(A·rad/s)] (separately excited and shunt). */
  readonly kv: number;
  /** Series motor constant Kaf [H], and series field resistance Rs [Ω] and inductance Ls [H]. */
  readonly kaf: number;
  readonly rs: number;
  readonly ls: number;
  /** Starting resistance in series with the armature, Rst [Ω]. */
  readonly rst: number;
  /** Total inertia J [kg·m²] and viscous friction B [N·m·s/rad]. */
  readonly inertia: number;
  readonly friction: number;
  /** Load T = C·Tr·(n/nr)^k. */
  readonly loadC: number;
  readonly loadRatedTorque: number;
  readonly loadRatedSpeedRpm: number;
  readonly loadExponent: LoadExponent;
}

export interface DcMotorOutputs extends Readonly<Record<string, number>> {
  readonly armatureCurrent: number;
  readonly speed: number;
  readonly speedRpm: number;
  readonly backEmf: number;
  readonly armatureVoltage: number;
  readonly fieldCurrent: number;
  readonly fieldVoltage: number;
  readonly torque: number;
  readonly loadTorque: number;
  readonly inputPower: number;
  readonly outputPower: number;
  readonly copperLoss: number;
  readonly efficiency: number;
  /** 1 when a single-quadrant converter is holding the armature current at zero, else 0. */
  readonly conductionBlocked: number;
}

/** Numeric parameter limits (SI; angles in radians). Shared with the UI controls. */
export const DC_LIMITS = {
  armatureVoltage: { min: -300, max: 300 },
  fieldVoltage: { min: 0, max: 300 },
  supplyRms: { min: 50, max: 500 },
  alpha: { min: 0, max: Math.PI },
  ra: { min: 0.01, max: 20 },
  la: { min: 0.0005, max: 1 },
  rf: { min: 10, max: 1000 },
  kv: { min: 0.1, max: 5 },
  kaf: { min: 0.005, max: 0.5 },
  rs: { min: 0, max: 10 },
  ls: { min: 0, max: 1 },
  rst: { min: 0, max: 50 },
  inertia: { min: 0.001, max: 10 },
  friction: { min: 0, max: 1 },
  loadC: { min: 0, max: 2 },
  loadRatedTorque: { min: 0, max: 500 },
  loadRatedSpeedRpm: { min: 100, max: 6000 },
} as const;

const DEG = Math.PI / 180;

/**
 * Presets. Machine values are textbook-typical (decision D4: UTeM bench data not
 * yet supplied). "Separately excited" reproduces RC-M01-01; "Converter-fed"
 * reproduces RC-M01-02 (course Tutorial 2 Q2).
 */
export const DC_PRESETS = {
  separatelyExcited: {
    motorType: 'separately-excited',
    supply: 'dc',
    armatureVoltage: 220,
    fieldVoltage: 220,
    supplyRms: 240,
    armatureConverter: 'single-full',
    alphaArmature: 60 * DEG,
    fieldConverter: 'single-full',
    alphaField: 0,
    ra: 0.5,
    la: 0.01,
    rf: 220,
    kv: 1.2,
    kaf: 0.04,
    rs: 0.2,
    ls: 0.005,
    rst: 0,
    inertia: 0.2,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 24,
    loadRatedSpeedRpm: 1500,
    loadExponent: 0,
  },
  shunt: {
    motorType: 'shunt',
    supply: 'dc',
    armatureVoltage: 220,
    fieldVoltage: 220,
    supplyRms: 240,
    armatureConverter: 'single-full',
    alphaArmature: 60 * DEG,
    fieldConverter: 'single-full',
    alphaField: 0,
    ra: 0.5,
    la: 0.01,
    rf: 220,
    kv: 1.2,
    kaf: 0.04,
    rs: 0.2,
    ls: 0.005,
    rst: 0,
    inertia: 0.2,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 24,
    loadRatedSpeedRpm: 1500,
    loadExponent: 0,
  },
  series: {
    motorType: 'series',
    supply: 'dc',
    armatureVoltage: 220,
    fieldVoltage: 0,
    supplyRms: 240,
    armatureConverter: 'single-full',
    alphaArmature: 60 * DEG,
    fieldConverter: 'single-full',
    alphaField: 0,
    ra: 0.3,
    la: 0.01,
    rf: 220,
    kv: 1.2,
    kaf: 0.04,
    rs: 0.2,
    ls: 0.005,
    rst: 0,
    inertia: 0.2,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 40,
    loadRatedSpeedRpm: 1500,
    loadExponent: 0,
  },
  converterFed: {
    motorType: 'separately-excited',
    supply: 'converter',
    armatureVoltage: 220,
    fieldVoltage: 220,
    supplyRms: 440,
    armatureConverter: 'single-full',
    alphaArmature: 60 * DEG,
    fieldConverter: 'single-full',
    alphaField: 0,
    ra: 0.25,
    la: 0.02,
    rf: 175,
    kv: 1.4,
    kaf: 0.04,
    rs: 0.2,
    ls: 0.005,
    rst: 0,
    inertia: 0.5,
    friction: 0,
    loadC: 1,
    loadRatedTorque: 142.610058,
    loadRatedSpeedRpm: 1500,
    loadExponent: 0,
  },
} as const satisfies Record<string, DcMotorParams>;

export type DcPresetName = keyof typeof DC_PRESETS;

/** Armature terminal voltage Va [V] (average value for a converter). */
export function dcArmatureVoltage(p: DcMotorParams): number {
  if (p.supply === 'dc') return p.armatureVoltage;
  return converterAverageVoltage(
    p.armatureConverter,
    converterPeak(p.armatureConverter, p.supplyRms),
    p.alphaArmature,
  );
}

/** Field voltage [V]: separate supply or field converter; across the armature for shunt; none for series. */
export function dcFieldVoltage(p: DcMotorParams, va: number): number {
  if (p.motorType === 'series') return 0;
  if (p.motorType === 'shunt') return va;
  if (p.supply === 'dc') return p.fieldVoltage;
  return converterAverageVoltage(
    p.fieldConverter,
    converterPeak(p.fieldConverter, p.supplyRms),
    p.alphaField,
  );
}

/** True when the armature supply cannot carry negative current. */
export function isUnidirectional(p: DcMotorParams): boolean {
  return p.supply === 'converter' && !canReverseCurrent(p.armatureConverter);
}

function circuit(p: DcMotorParams) {
  const series = p.motorType === 'series';
  return {
    r: p.ra + p.rst + (series ? p.rs : 0),
    l: p.la + (series ? p.ls : 0),
  };
}

/** Load torque acting on the shaft, opposing motion; at standstill it holds the shaft up to its value. */
function effectiveLoad(p: DcMotorParams, omega: number, td: number): number {
  const tl = loadTorque(
    p.loadC,
    p.loadRatedTorque,
    radPerSecToRpm(omega),
    p.loadRatedSpeedRpm,
    p.loadExponent,
  );
  if (omega > 0) return tl;
  if (omega < 0) return -tl;
  return Math.max(-tl, Math.min(tl, td));
}

function torqueAndEmf(p: DcMotorParams, ia: number, omega: number, ifield: number) {
  if (p.motorType === 'series') {
    return { td: seriesTorque(p.kaf, ia), eg: seriesBackEmf(p.kaf, ia, omega) };
  }
  return { td: developedTorque(p.kv, ifield, ia), eg: backEmf(p.kv, ifield, omega) };
}

function range(
  issues: Issue[],
  key: keyof typeof DC_LIMITS,
  value: number,
  label: string,
  unit: string,
  displayScale = 1,
) {
  const lim = DC_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    const lo = Math.round(lim.min * displayScale * 1e6) / 1e6;
    const hi = Math.round(lim.max * displayScale * 1e6) / 1e6;
    issues.push({
      parameter: key,
      severity: 'error',
      message: `${label} must be between ${lo} and ${hi} ${unit}.`,
    });
  }
}

/**
 * Motor characteristic: steady-state speed ω [rad/s] at which the motor develops
 * torque `torque` [N·m] for the present supply and field (dIa/dt = 0):
 *   separately excited / shunt: ω = (Va − R·T/K)/K, K = Kv·If
 *   series: Ia = √(T/Kaf), ω = (Va − R·Ia)/(Kaf·Ia)
 * Friction is counted on the load side (see dcLoadTorqueAtSpeed).
 * Returns NaN where the characteristic is undefined (no flux, or T ≤ 0 for a series motor).
 */
export function dcSteadySpeedAtTorque(p: DcMotorParams, torque: number): number {
  const va = dcArmatureVoltage(p);
  const { r } = circuit(p);
  if (p.motorType === 'series') {
    if (!(torque > 0)) return Number.NaN;
    const ia = Math.sqrt(torque / p.kaf);
    return (va - r * ia) / (p.kaf * ia);
  }
  const k = p.kv * fieldCurrent(dcFieldVoltage(p, va), p.rf);
  if (!(k > 0)) return Number.NaN;
  return (va - (r * torque) / k) / k;
}

/** Torque the load demands at speed ω: TL(n) + B·ω [N·m], for ω ≥ 0. */
export function dcLoadTorqueAtSpeed(p: DcMotorParams, omega: number): number {
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

export const dcMotorModel: SimModel<DcMotorParams, DcMotorOutputs> = {
  id: 'm01.dc-motor',
  modelClass: 'dynamic',
  defaults: DC_PRESETS.separatelyExcited,
  stateLabels: ['Ia [A]', 'ω [rad/s]'],
  assumptions: [
    'Linear magnetic circuit: flux is proportional to field current (separately excited and shunt) or to armature current (series). No saturation.',
    'No armature reaction, brush drop or commutation effects.',
    'The field current follows its supply instantly: the field winding time constant is neglected.',
    'Converters are represented by their average output voltage with continuous conduction; ripple and discontinuous-conduction waveforms are not modelled.',
    'Single-quadrant converters cannot carry negative current: the armature current is held at zero when it would reverse.',
    'Ideal DC supply with no internal resistance. Viscous friction B·ω and the load law C·Tr·(n/nr)^k are the only mechanical losses.',
    'Simplified educational model: it is not a substitute for a full machine or drive simulation.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    if (p.supply === 'dc') {
      range(issues, 'armatureVoltage', p.armatureVoltage, 'Armature voltage', 'V');
      if (p.motorType === 'separately-excited') {
        range(issues, 'fieldVoltage', p.fieldVoltage, 'Field voltage', 'V');
      }
    } else {
      range(issues, 'supplyRms', p.supplyRms, 'Supply voltage', 'V');
      range(issues, 'alpha', p.alphaArmature, 'Armature firing angle', '°', 180 / Math.PI);
      if (p.motorType === 'separately-excited') {
        range(issues, 'alpha', p.alphaField, 'Field firing angle', '°', 180 / Math.PI);
      }
    }
    range(issues, 'ra', p.ra, 'Armature resistance', 'Ω');
    range(issues, 'la', p.la, 'Armature inductance', 'H');
    range(issues, 'rst', p.rst, 'Starting resistance', 'Ω');
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
    if (p.motorType === 'series') {
      range(issues, 'kaf', p.kaf, 'Series constant Kaf', 'H');
      range(issues, 'rs', p.rs, 'Series field resistance', 'Ω');
      range(issues, 'ls', p.ls, 'Series field inductance', 'H');
      if (p.loadC * p.loadRatedTorque < 1) {
        issues.push({
          parameter: 'loadRatedTorque',
          severity: 'warning',
          message:
            'A series motor must not run without load: as the load falls its speed rises without limit.',
        });
      }
    } else {
      range(issues, 'kv', p.kv, 'Motor constant Kv', 'V/(A·rad/s)');
      range(issues, 'rf', p.rf, 'Field resistance', 'Ω');
      if (issues.length === 0 && dcFieldVoltage(p, dcArmatureVoltage(p)) <= 0) {
        issues.push({
          parameter: p.motorType === 'shunt' ? 'armatureVoltage' : 'fieldVoltage',
          severity: 'error',
          message:
            'The field current must be greater than zero: with no flux the motor produces no torque, and a running motor would race.',
        });
      }
    }
    return issues;
  },

  init() {
    return [0, 0];
  },

  derivatives(_t, s, p) {
    const ia = s[0] as number;
    const omega = s[1] as number;
    const va = dcArmatureVoltage(p);
    const ifield = p.motorType === 'series' ? ia : fieldCurrent(dcFieldVoltage(p, va), p.rf);
    const { td, eg } = torqueAndEmf(p, ia, omega, ifield);
    const { r, l } = circuit(p);
    let dia = armatureCurrentDerivative(va, eg, ia, r, l);
    if (isUnidirectional(p) && ia <= 0 && dia < 0) dia = 0;
    // At standstill effectiveLoad balances any torque up to the load's value, so
    // a passive load holds the shaft instead of driving it backwards.
    const tl = effectiveLoad(p, omega, td);
    return [dia, speedDerivative(td, tl, p.friction, omega, p.inertia)];
  },

  project(s, p) {
    if (isUnidirectional(p) && (s[0] as number) < 0) return [0, s[1] as number];
    return s;
  },

  outputs(_t, s, p) {
    const ia = s[0] as number;
    const omega = s[1] as number;
    const va = dcArmatureVoltage(p);
    const vf = dcFieldVoltage(p, va);
    const ifield = p.motorType === 'series' ? ia : fieldCurrent(vf, p.rf);
    const { td, eg } = torqueAndEmf(p, ia, omega, ifield);
    const { r } = circuit(p);
    const tl = effectiveLoad(p, omega, td);
    // Input: armature power, plus field power for separately excited and shunt machines.
    const fieldPower = p.motorType === 'series' ? 0 : vf * ifield;
    const inputPower = va * ia + fieldPower;
    const outputPower = tl * omega;
    return {
      armatureCurrent: ia,
      speed: omega,
      speedRpm: radPerSecToRpm(omega),
      backEmf: eg,
      armatureVoltage: va,
      fieldCurrent: ifield,
      fieldVoltage: vf,
      torque: td,
      loadTorque: tl,
      inputPower,
      outputPower,
      copperLoss: ia * ia * r + fieldPower,
      efficiency: inputPower > 0 && outputPower > 0 ? outputPower / inputPower : 0,
      conductionBlocked: isUnidirectional(p) && ia <= 0 && va < eg ? 1 : 0,
    };
  },

  fastestTimeConstant(p) {
    const { r, l } = circuit(p);
    const candidates = [l / r];
    const va = Math.abs(dcArmatureVoltage(p));
    const k =
      p.motorType === 'series'
        ? p.kaf * (va / r) // largest flux the armature current can produce
        : p.kv * fieldCurrent(Math.abs(dcFieldVoltage(p, va)), p.rf);
    if (k > 0) candidates.push((p.inertia * r) / (k * k)); // electromechanical
    if (p.friction > 0) candidates.push(p.inertia / p.friction);
    return Math.min(...candidates);
  },
};
