/**
 * M04 stepper motor model: pulse train → step sequence → rotor position.
 *
 * State [q, k, n, θ, ω]:
 * - q: fraction of the next pulse period elapsed (0…1); dq/dt = PR while pulsing.
 * - k: signed step index (a pulse adds ±1 in `project`).
 * - n: pulses sent.
 * - θ [rad], ω [rad/s]: rotor angle and speed (clockwise positive).
 *
 * Ideal rotor (default, as the plan states: no missed steps): θ follows the
 * detent angle of step k. Rotor dynamics (extension): J·dω/dt = T(θ, k) − B·ω − TL
 * with the sinusoidal torque–angle law of `stepperTorque`.
 *
 * Model document: docs/simulation-models/m04-stepper-motor.md.
 * Reference cases: docs/reference-cases/stepper-motor.md.
 */
import {
  electricalCycles,
  equilibriumAngle,
  phaseCurrents,
  pulsesPerRevolution,
  stepAngleFromSteps,
  stepAngleFromTeeth,
  stepFraction,
  stepperGeometryIssue,
  stepperSpeed,
  stepperTorque,
  stepTime,
  vrPhaseCount,
  type StepMode,
  type StepperFamily,
} from '../equations/stepper';
import type { Issue, SimModel } from '../types';
import { radPerSecToRpm, radToDeg } from '../units';

export type StepDirection = 'cw' | 'ccw';
export type CoilDrive = 'unipolar' | 'bipolar';

export interface StepperParams {
  readonly family: StepperFamily;
  /** VR motors: stator poles Ns and rotor teeth Nr. */
  readonly statorTeeth: number;
  readonly rotorTeeth: number;
  /** PM and hybrid motors: full steps per revolution (datasheet). */
  readonly stepsPerRev: number;
  readonly mode: StepMode;
  /** Microsteps per full step (micro mode only). */
  readonly microsteps: number;
  /** Two-phase motors: unipolar (centre-tapped, four coils) or bipolar (two coils, reversible). */
  readonly coilDrive: CoilDrive;
  readonly direction: StepDirection;
  /** Pulse rate PR [pulses/s]. */
  readonly pulseRate: number;
  /** Pulses to send, then stop; 0 = run continuously. */
  readonly pulseLimit: number;
  /** false: ideal rotor that follows every step; true: rotor dynamics (extension). */
  readonly rotorDynamics: boolean;
  /** Peak (holding) torque of one phase at rated current [N·m]. */
  readonly peakTorque: number;
  /** Rotor plus load inertia [kg·m²]. */
  readonly inertia: number;
  /** Viscous damping [N·m·s/rad]. */
  readonly damping: number;
  /** Constant load torque acting against clockwise rotation (like a hanging weight) [N·m]. */
  readonly loadTorque: number;
}

export interface StepperOutputs {
  readonly [key: string]: number;
  readonly fullStepAngle: number;
  readonly stepAngle: number;
  readonly phases: number;
  readonly ppr: number;
  readonly pulseRate: number;
  readonly stepTime: number;
  readonly commandSpeed: number;
  readonly commandSpeedRpm: number;
  readonly pulses: number;
  readonly stepIndex: number;
  readonly commandAngle: number;
  readonly commandAngleDeg: number;
  readonly rotorAngle: number;
  readonly rotorAngleDeg: number;
  readonly rotorSpeed: number;
  readonly rotorSpeedRpm: number;
  readonly positionErrorDeg: number;
  readonly lostSteps: number;
  readonly motorTorque: number;
  readonly pulsing: number;
  readonly i0: number;
  readonly i1: number;
  readonly i2: number;
  readonly i3: number;
  readonly i4: number;
  /** Unipolar (centre-tapped) coil states of a two-phase motor: A, Ā, B, B̄ on (1) or off (0). */
  readonly coilA: number;
  readonly coilAbar: number;
  readonly coilB: number;
  readonly coilBbar: number;
}

export const STEPPER_LIMITS = {
  statorTeeth: { min: 3, max: 48 },
  rotorTeeth: { min: 2, max: 50 },
  stepsPerRev: { min: 4, max: 400 },
  pulseRate: { min: 1, max: 5000 },
  pulseLimit: { min: 0, max: 100_000 },
  peakTorque: { min: 0.001, max: 5 },
  inertia: { min: 1e-7, max: 0.01 },
  damping: { min: 0, max: 0.1 },
  loadTorque: { min: 0, max: 5 },
} as const;

export const MICROSTEP_OPTIONS = [2, 4, 8, 16] as const;

const BASE = {
  mode: 'wave',
  microsteps: 16,
  coilDrive: 'bipolar',
  direction: 'cw',
  pulseLimit: 0,
  rotorDynamics: false,
  loadTorque: 0,
} as const;

/**
 * Presets. Tooth counts and pulse rates are course examples; torque, inertia and
 * damping are typical values (assumed; D4 bench data not yet supplied), chosen
 * for a damping ratio of about 0.1.
 */
export const STEPPER_PRESETS = {
  /** Course lab motor: 3-phase 6/4 VR, 30° step; 20 pulses/s = 100 rpm (Tutorial 3 Q5). */
  vr64: {
    ...BASE,
    family: 'vr',
    statorTeeth: 6,
    rotorTeeth: 4,
    stepsPerRev: 12,
    coilDrive: 'unipolar',
    pulseRate: 20,
    peakTorque: 0.2,
    inertia: 2e-5,
    damping: 8e-4,
  },
  /** Tutorial 3 Q2–Q3: 12/8 VR, 15° step; 300 pulses/s = 750 rpm. */
  vr128: {
    ...BASE,
    family: 'vr',
    statorTeeth: 12,
    rotorTeeth: 8,
    stepsPerRev: 24,
    coilDrive: 'unipolar',
    pulseRate: 300,
    peakTorque: 0.2,
    inertia: 2e-5,
    damping: 1.131e-3,
  },
  /** Permanent magnet, 7.5° (48 steps/rev). */
  pm: {
    ...BASE,
    family: 'pm',
    statorTeeth: 6,
    rotorTeeth: 4,
    stepsPerRev: 48,
    pulseRate: 100,
    peakTorque: 0.05,
    inertia: 2e-6,
    damping: 2.19e-4,
  },
  /** Hybrid, 1.8° (200 steps/rev); 500 pulses/s = 150 rpm (course MCQ set). */
  hybrid: {
    ...BASE,
    family: 'hybrid',
    statorTeeth: 6,
    rotorTeeth: 4,
    stepsPerRev: 200,
    pulseRate: 500,
    peakTorque: 0.4,
    inertia: 1e-5,
    damping: 2.83e-3,
  },
} satisfies Record<string, StepperParams>;

export type StepperPresetName = keyof typeof STEPPER_PRESETS;

/** Full step angle [rad], phase count, electrical cycles per revolution and angle per pulse. */
export function stepperGeometry(p: StepperParams) {
  const vr = p.family === 'vr';
  const fullStepAngle = vr
    ? stepAngleFromTeeth(p.statorTeeth, p.rotorTeeth)
    : stepAngleFromSteps(p.stepsPerRev);
  const phases = vr ? Math.round(vrPhaseCount(p.statorTeeth, p.rotorTeeth)) : 2;
  const stepAngle = fullStepAngle * stepFraction(p.mode, p.microsteps);
  return {
    fullStepAngle,
    phases,
    stepAngle,
    ppr: pulsesPerRevolution(stepAngle),
    ne: electricalCycles(p.family, fullStepAngle, phases),
    /** Full steps in one electrical cycle (VR: m; two-phase: 4). */
    stepsPerCycle: vr ? phases : 4,
  };
}

/** Phase currents and detent angle for step index k under these parameters. */
export function stepperStep(p: StepperParams, k: number) {
  const g = stepperGeometry(p);
  return {
    currents: phaseCurrents(p.family, g.phases, p.mode, k, p.microsteps),
    angle: equilibriumAngle(g.fullStepAngle, p.mode, k, p.microsteps),
  };
}

/** The first `rows` lines of the phase-sequence table (course lab tables), in the chosen direction. */
export function stepperSequenceTable(p: StepperParams, rows: number) {
  const dir = p.direction === 'cw' ? 1 : -1;
  // `|| 0` turns −0 (anticlockwise step 0) into 0.
  return Array.from({ length: rows }, (_, r) => ({ step: r, ...stepperStep(p, dir * r || 0) }));
}

function limitsActive(p: StepperParams, pulses: number): boolean {
  return p.pulseLimit === 0 || pulses < p.pulseLimit;
}

function range(
  issues: Issue[],
  key: keyof typeof STEPPER_LIMITS,
  value: number,
  label: string,
  unit: string,
) {
  const lim = STEPPER_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    issues.push({
      parameter: key,
      severity: 'error',
      message: `${label} must be between ${lim.min} and ${lim.max}${unit ? ` ${unit}` : ''}.`,
    });
  }
}

/** Largest holding torque of the present drive mode (two phases on a two-phase motor: √2·Tpk). */
function holdingTorque(p: StepperParams): number {
  return p.family !== 'vr' && p.mode === 'normal' ? Math.SQRT2 * p.peakTorque : p.peakTorque;
}

export const stepperMotorModel: SimModel<StepperParams, StepperOutputs> = {
  id: 'm04.stepper-motor',
  modelClass: 'dynamic',
  defaults: STEPPER_PRESETS.vr64,
  stateLabels: ['q [—]', 'k [steps]', 'n [pulses]', 'θ [rad]', 'ω [rad/s]'],
  assumptions: [
    'Step angle of a variable-reluctance motor from the course formula Sa = (Ns − Nr)/(Ns·Nr) × 360°; permanent-magnet and hybrid motors from their steps per revolution (datasheet).',
    'Ideal rotor (default): the rotor reaches each step position before the next pulse, so no steps are missed and there is no resonance.',
    'Rotor dynamics (extension): sinusoidal torque–angle curve, ideal current drive (winding inductance neglected, so torque does not fall with pulse rate as it does on a real motor), viscous damping and a constant load torque against clockwise rotation.',
    'Torque, inertia and damping are typical values chosen for teaching, not data for a particular motor (bench data not yet supplied).',
    'Microstepping (extension) assumes sine/cosine coil currents and a perfectly sinusoidal torque curve, so each microstep is equal.',
    'Simplified educational model: it is not a substitute for a motor or drive design tool.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    if (p.family === 'vr') {
      range(issues, 'statorTeeth', p.statorTeeth, 'Stator poles Ns', '');
      range(issues, 'rotorTeeth', p.rotorTeeth, 'Rotor teeth Nr', '');
      const geo = issues.length === 0 ? stepperGeometryIssue(p.statorTeeth, p.rotorTeeth) : null;
      if (geo) issues.push({ parameter: 'statorTeeth', severity: 'error', message: geo });
      if (p.mode === 'micro') {
        issues.push({
          parameter: 'mode',
          severity: 'error',
          message:
            'Microstepping is offered for two-phase permanent-magnet and hybrid motors only, as in the course driver table.',
        });
      }
    } else {
      range(issues, 'stepsPerRev', p.stepsPerRev, 'Steps per revolution', '');
      if (issues.length === 0 && (!Number.isInteger(p.stepsPerRev) || p.stepsPerRev % 4 !== 0)) {
        issues.push({
          parameter: 'stepsPerRev',
          severity: 'error',
          message:
            'A two-phase motor makes four full steps per electrical cycle, so its steps per revolution must be a whole multiple of 4 (for example 48 or 200).',
        });
      }
      if (p.mode === 'micro') {
        if (!(MICROSTEP_OPTIONS as readonly number[]).includes(p.microsteps)) {
          issues.push({
            parameter: 'microsteps',
            severity: 'error',
            message: 'Microsteps per full step must be 2, 4, 8 or 16 (driver resolution table).',
          });
        }
        if (p.coilDrive !== 'bipolar') {
          issues.push({
            parameter: 'coilDrive',
            severity: 'error',
            message:
              'Microstepping needs a bipolar driver that can set each coil current to any value in both directions.',
          });
        }
      }
    }
    range(issues, 'pulseRate', p.pulseRate, 'Pulse rate', 'pulses/s');
    range(issues, 'pulseLimit', p.pulseLimit, 'Number of pulses', '');
    if (!Number.isInteger(p.pulseLimit)) {
      issues.push({
        parameter: 'pulseLimit',
        severity: 'error',
        message: 'The number of pulses must be a whole number (0 runs continuously).',
      });
    }
    range(issues, 'peakTorque', p.peakTorque, 'Holding torque', 'N·m');
    range(issues, 'inertia', p.inertia, 'Inertia', 'kg·m²');
    range(issues, 'damping', p.damping, 'Damping', 'N·m·s/rad');
    range(issues, 'loadTorque', p.loadTorque, 'Load torque', 'N·m');
    if (issues.length === 0 && p.rotorDynamics && p.loadTorque >= holdingTorque(p)) {
      issues.push({
        parameter: 'loadTorque',
        severity: 'warning',
        message:
          'The load torque is at or above the holding torque: the motor cannot hold the load and the rotor will be pulled backwards.',
      });
    }
    return issues;
  },

  init(p) {
    const detent = stepperStep(p, 0).angle;
    // A loaded rotor at rest sits behind the detent by the load angle asin(TL/Thold)/Ne.
    const hold = holdingTorque(p);
    const sag =
      p.rotorDynamics && p.loadTorque > 0 && p.loadTorque < hold
        ? Math.asin(p.loadTorque / hold) / stepperGeometry(p).ne
        : 0;
    return [0, 0, 0, detent - sag, 0];
  },

  derivatives(_t, s, p) {
    const pulses = s[2] as number;
    const qDot = limitsActive(p, pulses) ? p.pulseRate : 0;
    if (!p.rotorDynamics) return [qDot, 0, 0, 0, 0];
    const g = stepperGeometry(p);
    const k = s[1] as number;
    const theta = s[3] as number;
    const omega = s[4] as number;
    const currents = phaseCurrents(p.family, g.phases, p.mode, k, p.microsteps);
    const tm = stepperTorque(p.family, currents, theta, g.ne, p.peakTorque);
    return [qDot, 0, 0, omega, (tm - p.damping * omega - p.loadTorque) / p.inertia];
  },

  project(s, p) {
    let q = s[0] as number;
    let k = s[1] as number;
    let pulses = s[2] as number;
    const dir = p.direction === 'cw' ? 1 : -1;
    // 1e-9 absorbs rounding in the sum of fixed steps, so pulses fall on schedule.
    while (q >= 1 - 1e-9 && limitsActive(p, pulses)) {
      q = Math.max(0, q - 1);
      k += dir;
      pulses += 1;
    }
    if (!limitsActive(p, pulses)) q = 0;
    if (p.rotorDynamics) return [q, k, pulses, s[3] as number, s[4] as number];
    return [q, k, pulses, stepperStep(p, k).angle, 0];
  },

  fastestTimeConstant(p) {
    const pulsePeriod = stepTime(p.pulseRate);
    if (!p.rotorDynamics) return pulsePeriod;
    const g = stepperGeometry(p);
    // Small-signal natural frequency with the stiffest drive mode (√2·Tpk).
    const wn = Math.sqrt((g.ne * Math.SQRT2 * p.peakTorque) / p.inertia);
    const tauDamping = p.damping > 0 ? p.inertia / p.damping : Number.POSITIVE_INFINITY;
    return Math.min(pulsePeriod, 1 / wn, tauDamping);
  },

  outputs(_t, s, p) {
    const g = stepperGeometry(p);
    const k = s[1] as number;
    const pulses = s[2] as number;
    const theta = s[3] as number;
    const dir = p.direction === 'cw' ? 1 : -1;
    const step = stepperStep(p, k);
    const pulsing = limitsActive(p, pulses);
    const commandSpeed = pulsing ? dir * stepperSpeed(g.stepAngle, p.pulseRate) : 0;
    const rotorSpeed = p.rotorDynamics ? (s[4] as number) : commandSpeed;
    const error = step.angle - theta;
    const cycle = (2 * Math.PI) / g.ne;
    const slipped = Math.round(error / cycle);
    const motorTorque = p.rotorDynamics
      ? stepperTorque(p.family, step.currents, theta, g.ne, p.peakTorque)
      : 0;
    const i = step.currents;
    return {
      fullStepAngle: g.fullStepAngle,
      stepAngle: g.stepAngle,
      phases: g.phases,
      ppr: g.ppr,
      pulseRate: p.pulseRate,
      stepTime: stepTime(p.pulseRate),
      commandSpeed,
      commandSpeedRpm: radPerSecToRpm(commandSpeed),
      pulses,
      stepIndex: k,
      commandAngle: step.angle,
      commandAngleDeg: radToDeg(step.angle),
      rotorAngle: theta,
      rotorAngleDeg: radToDeg(theta),
      rotorSpeed,
      rotorSpeedRpm: radPerSecToRpm(rotorSpeed),
      positionErrorDeg: radToDeg(error),
      lostSteps: slipped * g.stepsPerCycle,
      motorTorque,
      pulsing: pulsing ? 1 : 0,
      i0: i[0] ?? 0,
      i1: i[1] ?? 0,
      i2: i[2] ?? 0,
      i3: i[3] ?? 0,
      i4: i[4] ?? 0,
      // A unipolar driver reverses the field by switching to the other half-coil.
      coilA: Math.max(0, i[0] ?? 0),
      coilAbar: Math.max(0, -(i[0] ?? 0)),
      coilB: Math.max(0, i[1] ?? 0),
      coilBbar: Math.max(0, -(i[1] ?? 0)),
    };
  },
};
