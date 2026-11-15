/**
 * M06 mechanical transmission: a drive train of one to three compound stages
 * (gear pair with optional idler, open or crossed belt, chain), plus the course's
 * belt-tension and lifting-pulley calculations.
 *
 * Kinematic model: state [θ0], the input shaft angle, with dθ0/dt = ω_in. Every
 * other shaft angle is θ0·(direction product)/(ratio product), so the animation
 * and all speeds come from the same equations. Torque through the train
 * (T_out = η·G·T_in) is an extension.
 *
 * Model document: docs/simulation-models/m06-transmission.md.
 * Reference cases: docs/reference-cases/transmission.md.
 */
import {
  beltPower,
  beltSpeed,
  beltTorque,
  liftingPulley,
  machineEfficiency,
  outputTorque,
  stageDirection,
  stageRatio,
  type DriveKind,
} from '../equations/transmission';
import type { Issue, SimModel } from '../types';
import { radPerSecToRpm } from '../units';

export interface DriveStage {
  readonly kind: DriveKind;
  /** Driver size: teeth (gear, chain) or diameter [m] (belt). */
  readonly driver: number;
  /** Driven size, same unit as the driver. */
  readonly driven: number;
  /** Idler gear teeth between driver and driven (gear stages only); 0 = no idler. */
  readonly idler: number;
  /** Stage efficiency (extension; 1 = ideal, as in the course). */
  readonly efficiency: number;
}

export interface TransmissionParams {
  /** Input shaft speed [rad/s], magnitude. */
  readonly inputSpeed: number;
  /** +1 clockwise, −1 anticlockwise. */
  readonly inputDirection: 1 | -1;
  /** Input torque [N·m] (extension). */
  readonly inputTorque: number;
  /** One to three stages; the driven wheel of a stage shares its shaft with the next driver. */
  readonly stages: readonly DriveStage[];
  /** Belt tension calculation: tight and slack tensions [N], pulley radii [m]. */
  readonly beltTight: number;
  readonly beltSlack: number;
  readonly beltDriverRadius: number;
  readonly beltDrivenRadius: number;
  /** Lifting pulley: supporting rope segments, load [N], load rise [m], efficiency. */
  readonly liftSupports: number;
  readonly liftLoad: number;
  readonly liftHeight: number;
  readonly liftEfficiency: number;
}

export interface TransmissionOutputs {
  readonly [key: string]: number;
  readonly overallRatio: number;
  readonly outputSpeedRpm: number;
  readonly outputTorque: number;
  readonly inputPower: number;
  readonly outputPower: number;
  readonly beltTorqueDriver: number;
  readonly beltTorqueDriven: number;
  readonly beltSpeed: number;
  readonly beltPower: number;
  readonly liftEffort: number;
  readonly liftMA: number;
  readonly liftVR: number;
  readonly liftEfficiency: number;
  readonly liftEffortDistance: number;
}

export const TRANSMISSION_LIMITS = {
  inputSpeed: { min: 0, max: 400 },
  inputTorque: { min: 0, max: 1000 },
  teeth: { min: 6, max: 200 },
  diameter: { min: 0.01, max: 1 },
  efficiency: { min: 0.5, max: 1 },
  beltTension: { min: 0, max: 20_000 },
  beltRadius: { min: 0.005, max: 0.5 },
  liftSupports: { min: 1, max: 8 },
  liftLoad: { min: 0.1, max: 100_000 },
  liftHeight: { min: 0.01, max: 100 },
  liftEfficiency: { min: 0.3, max: 1 },
} as const;

const RPM = (2 * Math.PI) / 60;

const COMMON = {
  inputTorque: 10,
  beltTight: 500,
  beltSlack: 200,
  beltDriverRadius: 0.1,
  beltDrivenRadius: 0.25,
  liftSupports: 4,
  liftLoad: 100,
  liftHeight: 1,
  liftEfficiency: 1,
} as const;

const gear = (driver: number, driven: number, idler = 0): DriveStage => ({
  kind: 'gear',
  driver,
  driven,
  idler,
  efficiency: 1,
});
const belt = (kind: DriveKind, driver: number, driven: number): DriveStage => ({
  kind,
  driver,
  driven,
  idler: 0,
  efficiency: 1,
});

/** Presets from the course examples (LN Ch3 Part II, Tutorial 4). */
export const TRANSMISSION_PRESETS = {
  /** Example 1: 60T at 120 rpm drives 30T. */
  simple: { ...COMMON, inputSpeed: 120 * RPM, inputDirection: 1, stages: [gear(60, 30)] },
  /** Tutorial 4 Q4: 16T at 600 rpm CW, idler 28T, 84T. */
  idler: { ...COMMON, inputSpeed: 600 * RPM, inputDirection: 1, stages: [gear(16, 84, 28)] },
  /** Example 4: 120T at 30 rpm CW → 40T; 80T on that shaft → 20T. */
  compound: {
    ...COMMON,
    inputSpeed: 30 * RPM,
    inputDirection: 1,
    stages: [gear(120, 40), gear(80, 20)],
  },
  /** Belt train A–F: 100 mm at 60 rpm ACW, crossed to 200 mm; 100 → 120 mm; 40 → 30 mm. */
  beltTrain: {
    ...COMMON,
    inputSpeed: 60 * RPM,
    inputDirection: -1,
    stages: [
      belt('belt-crossed', 0.1, 0.2),
      belt('belt-open', 0.1, 0.12),
      belt('belt-open', 0.04, 0.03),
    ],
  },
  /** Tutorial 4 Q6: bicycle, pedal 60T at 150 rpm CW, chain to 30T. */
  chain: {
    ...COMMON,
    inputSpeed: 150 * RPM,
    inputDirection: 1,
    stages: [{ kind: 'chain', driver: 60, driven: 30, idler: 0, efficiency: 1 }],
  },
} satisfies Record<string, TransmissionParams>;

export type TransmissionPresetName = keyof typeof TRANSMISSION_PRESETS;

/** Speeds and directions of every shaft (and idler) for these parameters. */
export function transmissionShafts(p: TransmissionParams) {
  const shafts: { speed: number; ratio: number; torque: number }[] = [];
  const idlers: { speed: number; stage: number }[] = [];
  let speed = p.inputDirection * p.inputSpeed;
  let ratio = 1;
  let torque = p.inputTorque;
  shafts.push({ speed, ratio, torque });
  p.stages.forEach((s, i) => {
    const g = stageRatio(s.driver, s.driven);
    if (s.kind === 'gear' && s.idler > 0) {
      idlers.push({ speed: -speed * (s.driver / s.idler), stage: i });
    }
    const dir = stageDirection(s.kind, s.kind === 'gear' && s.idler > 0 ? 1 : 0);
    speed = (dir * speed) / g;
    ratio *= g;
    torque = outputTorque(torque, g, s.efficiency);
    shafts.push({ speed, ratio, torque });
  });
  return { shafts, idlers };
}

function check(issues: Issue[], parameter: string, ok: boolean, message: string) {
  if (!ok) issues.push({ parameter, severity: 'error', message });
}

const within = (v: number, lim: { readonly min: number; readonly max: number }) =>
  Number.isFinite(v) && v >= lim.min && v <= lim.max;

export const transmissionModel: SimModel<TransmissionParams, TransmissionOutputs> = {
  id: 'm06.transmission',
  modelClass: 'dynamic',
  defaults: TRANSMISSION_PRESETS.simple,
  stateLabels: ['θ0 [rad]'],
  assumptions: [
    'Gear ratio G = T_driven/T_driver (belts: D_driven/D_driver); N_out = N_in/G. G greater than 1 is a speed reduction.',
    'Rigid wheels and shafts; no backlash; belts and chains do not slip or stretch (a timing belt or chain behaves exactly so).',
    'Each external gear mesh reverses the direction; an idler does not change the ratio; open belts and chains keep the direction; crossed belts reverse it.',
    'Torque through the train, T_out = η·G·T_in, and stage efficiency are an extension: the course states only that a speed reduction increases torque.',
    'Lifting pulleys: ideal mechanical advantage equals the number of supporting rope segments; efficiency below 100 % is an extension.',
    'Simplified educational model: it is not a substitute for machine-design calculations.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    const L = TRANSMISSION_LIMITS;
    check(
      issues,
      'inputSpeed',
      within(p.inputSpeed, L.inputSpeed),
      'Input speed must be between 0 and about 3800 rpm (400 rad/s).',
    );
    check(
      issues,
      'inputTorque',
      within(p.inputTorque, L.inputTorque),
      'Input torque must be between 0 and 1000 N·m.',
    );
    check(
      issues,
      'stages',
      p.stages.length >= 1 && p.stages.length <= 3,
      'A drive train has one to three stages.',
    );
    p.stages.forEach((s, i) => {
      const key = `stage${i + 1}`;
      if (s.kind === 'belt-open' || s.kind === 'belt-crossed') {
        check(
          issues,
          key,
          within(s.driver, L.diameter) && within(s.driven, L.diameter),
          `Stage ${i + 1}: pulley diameters must be between 10 and 1000 mm.`,
        );
      } else {
        check(
          issues,
          key,
          within(s.driver, L.teeth) &&
            within(s.driven, L.teeth) &&
            Number.isInteger(s.driver) &&
            Number.isInteger(s.driven),
          `Stage ${i + 1}: tooth counts must be whole numbers from 6 to 200.`,
        );
      }
      if (s.idler !== 0) {
        check(
          issues,
          key,
          s.kind === 'gear' && within(s.idler, L.teeth) && Number.isInteger(s.idler),
          `Stage ${i + 1}: an idler is a gear with 6 to 200 teeth, used between two gears only.`,
        );
      }
      check(
        issues,
        key,
        within(s.efficiency, L.efficiency),
        `Stage ${i + 1}: efficiency must be between 0.5 and 1.`,
      );
    });
    check(
      issues,
      'beltTight',
      within(p.beltTight, L.beltTension) && within(p.beltSlack, L.beltTension),
      'Belt tensions must be between 0 and 20 000 N.',
    );
    check(
      issues,
      'beltTight',
      p.beltTight >= p.beltSlack,
      'The tight-side tension T1 must be at least the slack-side tension T2: otherwise the belt drives the other way.',
    );
    check(
      issues,
      'beltDriverRadius',
      within(p.beltDriverRadius, L.beltRadius) && within(p.beltDrivenRadius, L.beltRadius),
      'Pulley radii must be between 5 and 500 mm.',
    );
    check(
      issues,
      'liftSupports',
      within(p.liftSupports, L.liftSupports) && Number.isInteger(p.liftSupports),
      'The number of supporting rope segments must be a whole number from 1 to 8.',
    );
    check(
      issues,
      'liftLoad',
      within(p.liftLoad, L.liftLoad),
      'The load must be between 0.1 N and 100 kN.',
    );
    check(
      issues,
      'liftHeight',
      within(p.liftHeight, L.liftHeight),
      'The load rise must be between 0.01 and 100 m.',
    );
    check(
      issues,
      'liftEfficiency',
      within(p.liftEfficiency, L.liftEfficiency),
      'Pulley efficiency must be between 0.3 and 1.',
    );
    if (issues.length === 0) {
      p.stages.forEach((s, i) => {
        const g = stageRatio(s.driver, s.driven);
        if (s.kind !== 'gear' && s.kind !== 'chain' && (g > 3 || g < 1 / 3)) {
          issues.push({
            parameter: `stage${i + 1}`,
            severity: 'warning',
            message: `Stage ${i + 1}: a belt ratio beyond about 3:1 slips in practice (small wrap angle on the small pulley).`,
          });
        }
      });
    }
    return issues;
  },

  init() {
    return [0];
  },

  derivatives(_t, _s, p) {
    return [p.inputDirection * p.inputSpeed];
  },

  fastestTimeConstant(p) {
    const { shafts, idlers } = transmissionShafts(p);
    const fastest = Math.max(
      1,
      ...shafts.map((s) => Math.abs(s.speed)),
      ...idlers.map((s) => Math.abs(s.speed)),
    );
    return 1 / fastest;
  },

  outputs(_t, s, p) {
    const theta0 = s[0] as number;
    const { shafts, idlers } = transmissionShafts(p);
    const omega0 = p.inputDirection * p.inputSpeed;
    const out: Record<string, number> = {};
    shafts.forEach((sh, k) => {
      out[`speed${k}`] = sh.speed;
      out[`speedRpm${k}`] = radPerSecToRpm(sh.speed);
      // Each shaft turns in proportion to the input: θk = θ0·(ωk/ω0).
      out[`angle${k}`] = omega0 === 0 ? 0 : theta0 * (sh.speed / omega0);
      out[`torque${k}`] = sh.torque;
    });
    idlers.forEach((id) => {
      out[`idlerSpeedRpm${id.stage + 1}`] = radPerSecToRpm(id.speed);
      out[`idlerAngle${id.stage + 1}`] = omega0 === 0 ? 0 : theta0 * (id.speed / omega0);
    });
    const last = shafts[shafts.length - 1] ?? { speed: 0, ratio: 1, torque: 0 };
    const lift = liftingPulley(p.liftSupports, p.liftLoad, p.liftHeight, p.liftEfficiency);
    const beltV = beltSpeed(p.inputSpeed, p.beltDriverRadius);
    return {
      ...out,
      overallRatio: last.ratio,
      outputSpeedRpm: radPerSecToRpm(last.speed),
      outputTorque: last.torque,
      inputPower: p.inputTorque * p.inputSpeed,
      outputPower: last.torque * Math.abs(last.speed),
      beltTorqueDriver: beltTorque(p.beltTight, p.beltSlack, p.beltDriverRadius),
      beltTorqueDriven: beltTorque(p.beltTight, p.beltSlack, p.beltDrivenRadius),
      beltSpeed: beltV,
      beltPower: beltPower(p.beltTight, p.beltSlack, beltV),
      liftEffort: lift.effort,
      liftMA: lift.mechanicalAdvantage,
      liftVR: lift.velocityRatio,
      liftEfficiency: machineEfficiency(lift.mechanicalAdvantage, lift.velocityRatio),
      liftEffortDistance: lift.effortDistance,
    };
  },
};
