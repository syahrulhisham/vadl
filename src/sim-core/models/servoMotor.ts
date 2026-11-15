/**
 * M05 DC servo: armature-controlled DC motor (course formula sheet:
 * Td = J·dω/dt + Bω + TL, Eg = kφ·ω) in a closed loop.
 *
 *   Drive signal (course): Ve = Vcs − Vfc
 *   Amplifier:  Va = Kp·Ve + Ki·∫Ve dt − Kd·Kfb·ω   (position), limited to ±Vmax
 *               Va = Kp·Ve + Ki·∫Ve dt               (speed)
 *   Plant:      La·dIa/dt = Va − Ra·Ia − kφ·ω;  J·dω/dt = kφ·Ia − B·ω − TL;  dθ/dt = ω
 *
 * State [Ia, ω, θ, z] with z = ∫Ve dt. The integral stops while the amplifier is
 * saturated and the error would drive it further (anti-windup by clamping).
 * The course amplifier is proportional; Ki and Kd are an extension (L-16).
 *
 * Model document: docs/simulation-models/m05-servo-motor.md.
 * Reference cases: docs/reference-cases/servo-motor.md.
 */
import {
  encoderAngle,
  encoderChannels,
  encoderCount,
  resolverAngle,
  resolverOutputs,
  resolverQuadrant,
} from '../equations/servo';
import type { Issue, SimModel } from '../types';
import { cleanResidue, radPerSecToRpm, radToDeg } from '../units';

export type ServoMode = 'position' | 'speed';
export type ServoReference = 'step' | 'ramp' | 'sine';
export type ServoFeedback = 'potentiometer' | 'encoder';

export interface ServoParams {
  readonly mode: ServoMode;
  readonly reference: ServoReference;
  /** Step size or sine amplitude: rad (position) or rad/s (speed). */
  readonly referenceValue: number;
  /** Ramp slope: rad/s (position) or rad/s² (speed). */
  readonly referenceRate: number;
  /** Sine frequency [Hz]. */
  readonly referenceFrequency: number;
  /** Amplifier gain Kp [V/V], integral gain Ki [1/s], derivative gain Kd [s]. */
  readonly kp: number;
  readonly ki: number;
  readonly kd: number;
  /** Amplifier output limit ±Vmax [V]. */
  readonly vMax: number;
  readonly ra: number;
  readonly la: number;
  /** Motor constant kφ [V·s/rad = N·m/A]. */
  readonly kphi: number;
  readonly inertia: number;
  readonly friction: number;
  /** Constant load torque against positive rotation [N·m]. */
  readonly loadTorque: number;
  /** Position sensor gain Kfb [V/rad] (potentiometer, or the encoder count scaled to volts). */
  readonly positionGain: number;
  /** Tachometer gain Kt [V/(rad/s)]. */
  readonly tachGain: number;
  readonly feedback: ServoFeedback;
  /** Encoder lines per revolution. */
  readonly encoderLines: number;
}

export interface ServoOutputs {
  readonly [key: string]: number;
  readonly reference: number;
  readonly position: number;
  readonly positionDeg: number;
  readonly referenceDeg: number;
  readonly speed: number;
  readonly speedRpm: number;
  readonly referenceRpm: number;
  readonly error: number;
  readonly errorDeg: number;
  readonly errorRpm: number;
  readonly vcs: number;
  readonly vfc: number;
  readonly driveSignal: number;
  readonly armatureVoltage: number;
  readonly saturated: number;
  readonly armatureCurrent: number;
  readonly torque: number;
  readonly encoderCount: number;
  readonly encoderA: number;
  readonly encoderB: number;
  readonly encoderZ: number;
  readonly resolverSin: number;
  readonly resolverCos: number;
  readonly resolverAngleDeg: number;
  readonly resolverQuadrant: number;
}

export const SERVO_LIMITS = {
  referenceValue: { min: -400, max: 400 },
  referenceRate: { min: -400, max: 400 },
  referenceFrequency: { min: 0.1, max: 20 },
  kp: { min: 0, max: 200 },
  ki: { min: 0, max: 2000 },
  kd: { min: 0, max: 1 },
  vMax: { min: 1, max: 200 },
  ra: { min: 0.1, max: 20 },
  la: { min: 1e-5, max: 0.1 },
  kphi: { min: 0.01, max: 2 },
  inertia: { min: 1e-6, max: 0.1 },
  friction: { min: 0, max: 0.1 },
  loadTorque: { min: 0, max: 5 },
  positionGain: { min: 0.1, max: 10 },
  tachGain: { min: 0.01, max: 1 },
  encoderLines: { min: 1, max: 10_000 },
} as const;

const MOTOR = {
  ra: 2,
  la: 2e-3,
  kphi: 0.1,
  inertia: 1e-4,
  friction: 1e-4,
  vMax: 24,
  positionGain: 1,
  tachGain: 0.05,
  feedback: 'potentiometer',
  encoderLines: 500,
  referenceRate: 2,
  referenceFrequency: 1,
  loadTorque: 0,
  ki: 0,
  kd: 0,
} as const;

/**
 * Presets. Motor values are typical for a small DC servo (assumed, not bench
 * data): Ra 2 Ω, La 2 mH, kφ 0.1 N·m/A, J 1×10⁻⁴ kg·m², B 1×10⁻⁴ N·m·s/rad, ±24 V.
 */
export const SERVO_PRESETS = {
  /** Position step 90° with a proportional amplifier, Kp 5 (RC-M05-03: ζ ≈ 0.51). */
  position: {
    ...MOTOR,
    mode: 'position',
    reference: 'step',
    referenceValue: Math.PI / 2,
    kp: 5,
  },
  /** The same servo holding a 0.05 N·m load: steady error 0.2 rad (RC-M05-02). */
  positionLoad: {
    ...MOTOR,
    mode: 'position',
    reference: 'step',
    referenceValue: Math.PI / 2,
    kp: 5,
    loadTorque: 0.05,
  },
  /** Integral action removes the load error (extension). */
  positionPi: {
    ...MOTOR,
    mode: 'position',
    reference: 'step',
    referenceValue: Math.PI / 2,
    kp: 5,
    ki: 50,
    loadTorque: 0.05,
  },
  /** Position tracking of a 1 Hz sine. */
  tracking: {
    ...MOTOR,
    mode: 'position',
    reference: 'sine',
    referenceValue: Math.PI / 2,
    kp: 10,
    kd: 0.05,
  },
  /** Speed servo, 100 rad/s with a proportional amplifier, Kp 20 (RC-M05-04: 90.74 rad/s). */
  speed: {
    ...MOTOR,
    mode: 'speed',
    reference: 'step',
    referenceValue: 100,
    kp: 20,
  },
} satisfies Record<string, ServoParams>;

export type ServoPresetName = keyof typeof SERVO_PRESETS;

/** Reference at time t: rad (position) or rad/s (speed). */
export function servoReference(p: ServoParams, t: number): number {
  if (p.reference === 'step') return p.referenceValue;
  if (p.reference === 'ramp') return p.referenceRate * t;
  return p.referenceValue * Math.sin(2 * Math.PI * p.referenceFrequency * t);
}

/** Control quantities at (t, state): signals in volts and the limited amplifier output. */
export function servoControl(p: ServoParams, t: number, s: readonly number[]) {
  const omega = s[1] as number;
  const theta = s[2] as number;
  const z = s[3] as number;
  const ref = servoReference(p, t);
  let vcs: number;
  let vfc: number;
  let demand: number;
  if (p.mode === 'position') {
    const measured = p.feedback === 'encoder' ? encoderAngle(theta, p.encoderLines) : theta;
    vcs = p.positionGain * ref;
    vfc = p.positionGain * measured;
    demand = p.kp * (vcs - vfc) + p.ki * z - p.kd * p.positionGain * omega;
  } else {
    vcs = p.tachGain * ref;
    vfc = p.tachGain * omega;
    demand = p.kp * (vcs - vfc) + p.ki * z;
  }
  const va = Math.max(-p.vMax, Math.min(p.vMax, demand));
  return { ref, vcs, vfc, ve: vcs - vfc, demand, va, saturated: va !== demand };
}

function range(
  issues: Issue[],
  key: keyof typeof SERVO_LIMITS,
  value: number,
  label: string,
  unit: string,
) {
  const lim = SERVO_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    issues.push({
      parameter: key,
      severity: 'error',
      message: `${label} must be between ${lim.min} and ${lim.max}${unit ? ` ${unit}` : ''}.`,
    });
  }
}

export const servoMotorModel: SimModel<ServoParams, ServoOutputs> = {
  id: 'm05.dc-servo',
  modelClass: 'dynamic',
  defaults: SERVO_PRESETS.position,
  stateLabels: ['Ia [A]', 'ω [rad/s]', 'θ [rad]', '∫Ve [V·s]'],
  assumptions: [
    'Armature-controlled DC servo with a fixed field (separately excited, as in the course): linear motor constant kφ, no armature reaction or brush drop.',
    'The servo amplifier is a voltage source limited to ±Vmax; its own delay is neglected. Integral and derivative action are a VADL extension, not course content.',
    'Ideal sensors: the potentiometer and tachometer are exact; the encoder option quantises the measured angle to one quadrature count.',
    'Viscous friction only and a constant load torque against positive rotation; no backlash, Coulomb friction or shaft compliance.',
    'Motor values are typical for a small DC servo (assumed, not bench data).',
    'Continuous-time controller; a real digital servo drive samples at a finite rate.',
    'Simplified educational model: it is not a substitute for a control-design tool such as MATLAB/Simulink.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    const posMode = p.mode === 'position';
    if (p.reference === 'ramp')
      range(issues, 'referenceRate', p.referenceRate, 'Ramp rate', posMode ? 'rad/s' : 'rad/s²');
    else range(issues, 'referenceValue', p.referenceValue, 'Reference', posMode ? 'rad' : 'rad/s');
    if (p.reference === 'sine')
      range(issues, 'referenceFrequency', p.referenceFrequency, 'Sine frequency', 'Hz');
    range(issues, 'kp', p.kp, 'Amplifier gain Kp', '');
    range(issues, 'ki', p.ki, 'Integral gain Ki', '1/s');
    range(issues, 'kd', p.kd, 'Derivative gain Kd', 's');
    range(issues, 'vMax', p.vMax, 'Amplifier limit', 'V');
    range(issues, 'ra', p.ra, 'Armature resistance Ra', 'Ω');
    range(issues, 'la', p.la, 'Armature inductance La', 'H');
    range(issues, 'kphi', p.kphi, 'Motor constant kφ', 'V·s/rad');
    range(issues, 'inertia', p.inertia, 'Inertia J', 'kg·m²');
    range(issues, 'friction', p.friction, 'Viscous friction B', 'N·m·s/rad');
    range(issues, 'loadTorque', p.loadTorque, 'Load torque', 'N·m');
    range(issues, 'positionGain', p.positionGain, 'Position sensor gain Kfb', 'V/rad');
    range(issues, 'tachGain', p.tachGain, 'Tachometer gain Kt', 'V/(rad/s)');
    range(issues, 'encoderLines', p.encoderLines, 'Encoder lines', '');
    if (!Number.isInteger(p.encoderLines)) {
      issues.push({
        parameter: 'encoderLines',
        severity: 'error',
        message: 'An encoder disc has a whole number of lines.',
      });
    }
    if (issues.length === 0 && p.loadTorque > p.kphi * (p.vMax / p.ra)) {
      issues.push({
        parameter: 'loadTorque',
        severity: 'warning',
        message:
          'The load torque exceeds the stall torque kφ·Vmax/Ra: the amplifier cannot supply enough current to hold the load.',
      });
    }
    if (issues.length === 0 && p.kp === 0 && p.ki === 0) {
      issues.push({
        parameter: 'kp',
        severity: 'warning',
        message: 'With Kp = 0 and Ki = 0 the amplifier output is zero: the loop is open.',
      });
    }
    return issues;
  },

  init() {
    return [0, 0, 0, 0];
  },

  derivatives(t, s, p) {
    const ia = s[0] as number;
    const omega = s[1] as number;
    const c = servoControl(p, t, s);
    const windingUp = c.saturated && Math.sign(c.ve) === Math.sign(c.demand);
    return [
      (c.va - p.ra * ia - p.kphi * omega) / p.la,
      (p.kphi * ia - p.friction * omega - p.loadTorque) / p.inertia,
      omega,
      p.ki > 0 && !windingUp ? c.ve : 0,
    ];
  },

  fastestTimeConstant(p) {
    const loopGain = p.mode === 'position' ? p.kd * p.positionGain : p.kp * p.tachGain;
    const electromechanical = Math.sqrt(
      (p.ra * p.friction + p.kphi * (p.kphi + loopGain)) / (p.la * p.inertia),
    );
    const positionLoop =
      p.mode === 'position' ? Math.sqrt((p.kp * p.positionGain * p.kphi) / (p.ra * p.inertia)) : 0;
    const sensorGain = p.mode === 'position' ? p.positionGain : p.tachGain;
    const integral = Math.cbrt((p.ki * sensorGain * p.kphi) / (p.ra * p.inertia));
    const fastest = Math.max(p.ra / p.la, electromechanical, positionLoop, integral);
    return 1 / fastest;
  },

  outputs(t, s, p) {
    const ia = s[0] as number;
    const omega = s[1] as number;
    const theta = s[2] as number;
    const c = servoControl(p, t, s);
    const pos = p.mode === 'position';
    const ch = encoderChannels(theta, p.encoderLines);
    const r0 = resolverOutputs(theta, 1);
    const res = { sin: cleanResidue(r0.sin), cos: cleanResidue(r0.cos) };
    const error = pos ? c.ref - theta : c.ref - omega;
    const raw: ServoOutputs = {
      reference: c.ref,
      position: theta,
      positionDeg: radToDeg(theta),
      referenceDeg: pos ? radToDeg(c.ref) : Number.NaN,
      speed: omega,
      speedRpm: radPerSecToRpm(omega),
      referenceRpm: pos ? Number.NaN : radPerSecToRpm(c.ref),
      error,
      errorDeg: pos ? radToDeg(error) : Number.NaN,
      errorRpm: pos ? Number.NaN : radPerSecToRpm(error),
      vcs: c.vcs,
      vfc: c.vfc,
      driveSignal: c.ve,
      armatureVoltage: c.va,
      saturated: c.saturated ? 1 : 0,
      armatureCurrent: ia,
      torque: p.kphi * ia,
      encoderCount: encoderCount(theta, p.encoderLines),
      encoderA: ch.a,
      encoderB: ch.b,
      encoderZ: ch.z,
      resolverSin: res.sin,
      resolverCos: res.cos,
      resolverAngleDeg: radToDeg(resolverAngle(res.sin, res.cos)),
      resolverQuadrant: resolverQuadrant(res.sin, res.cos),
    };
    // Settled values carry integration residue (e.g. 1e−14 V); show it as 0.
    const cleaned: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) cleaned[k] = cleanResidue(v);
    return cleaned as ServoOutputs;
  },
};
