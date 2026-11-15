/**
 * M07 cam and follower: a plate (disc) cam turning clockwise at constant speed
 * with a radial knife-edge, roller or flat-faced follower.
 *
 * Kinematic model: state [θ], dθ/dt = ω. Displacement, velocity v = (ds/dθ)·ω and
 * acceleration a = (d²s/dθ²)·ω² come from `camMotion`.
 *
 * Model document: docs/simulation-models/m07-cam-follower.md.
 * Reference cases: docs/reference-cases/cam-follower.md.
 */
import {
  camMotion,
  camProfile,
  pressureAngle,
  type CamProgramme,
  type FollowerKind,
} from '../equations/cam';
import type { Issue, SimModel } from '../types';
import { degToRad, mToMm, radPerSecToRpm, radToDeg } from '../units';

export interface CamParams extends CamProgramme {
  readonly follower: FollowerKind;
  /** Base circle radius Rb [m]. */
  readonly baseRadius: number;
  /** Roller radius Rr [m] (roller follower only). */
  readonly rollerRadius: number;
  /** Cam speed [rad/s]. */
  readonly camSpeed: number;
}

export interface CamOutputs {
  readonly [key: string]: number;
  readonly camAngleDeg: number;
  readonly displacement: number;
  readonly displacementMm: number;
  readonly velocity: number;
  readonly acceleration: number;
  readonly segment: number;
  readonly pressureAngleDeg: number;
  readonly followerHeight: number;
  readonly camSpeedRpm: number;
}

export const CAM_LIMITS = {
  lift: { min: 0.001, max: 0.1 },
  riseAngle: { min: degToRad(10), max: degToRad(350) },
  dwellAngle: { min: 0, max: degToRad(340) },
  returnAngle: { min: degToRad(10), max: degToRad(350) },
  baseRadius: { min: 0.01, max: 0.2 },
  rollerRadius: { min: 0.002, max: 0.05 },
  camSpeed: { min: 0, max: 100 },
} as const;

const RPM = (2 * Math.PI) / 60;

const BASE = {
  follower: 'knife',
  law: 'uniform',
  baseRadius: 0.04,
  rollerRadius: 0.01,
  camSpeed: 10 * RPM,
} as const;

/** Presets: the course example and a rise–dwell–return–dwell programme. */
export const CAM_PRESETS = {
  /** LN Ch3 Part I p27–29: uniform velocity, 30 mm rise over 180°, return over 180°. */
  course: {
    ...BASE,
    lift: 0.03,
    riseAngle: Math.PI,
    dwellAngle: 0,
    returnAngle: Math.PI,
  },
  /** Rise 20 mm over 120°, dwell 60°, return over 90°, dwell 90° (RC-M07-03). */
  dwells: {
    ...BASE,
    follower: 'roller',
    lift: 0.02,
    riseAngle: degToRad(120),
    dwellAngle: degToRad(60),
    returnAngle: degToRad(90),
  },
  /** Flat-faced follower with simple harmonic motion (extension). */
  flatShm: {
    ...BASE,
    follower: 'flat',
    law: 'shm',
    lift: 0.02,
    riseAngle: degToRad(150),
    dwellAngle: degToRad(30),
    returnAngle: degToRad(150),
  },
} satisfies Record<string, CamParams>;

export type CamPresetName = keyof typeof CAM_PRESETS;

/** Displacement table at a fixed angle step (course construction: 30°, 45° or 22.5°) [m]. */
export function camDisplacementTable(p: CamProgramme, stepDeg: number) {
  const n = Math.round(360 / stepDeg);
  return Array.from({ length: n + 1 }, (_, i) => {
    const deg = i * stepDeg;
    // The end of the turn is the start: 360° reads 0.
    const s = i === n ? camMotion(p, 0).s : camMotion(p, degToRad(deg)).s;
    return { angleDeg: deg, displacement: s };
  });
}

/** The cam profile for these parameters, in the cam frame [m]. */
export function camProfileOf(p: CamParams, n = 720) {
  return camProfile(p, p.follower, p.baseRadius, p.rollerRadius, n);
}

/** Largest pressure angle over the turn for a knife-edge or roller follower [rad]. */
export function maxPressureAngle(p: CamParams): number {
  if (p.follower === 'flat') return 0;
  const prime = p.baseRadius + (p.follower === 'roller' ? p.rollerRadius : 0);
  let worst = 0;
  for (let i = 0; i < 720; i += 1) {
    const m = camMotion(p, (i / 720) * 2 * Math.PI);
    worst = Math.max(worst, Math.abs(pressureAngle(m.ds, m.s, prime)));
  }
  return worst;
}

/** Smallest value of Rb + s + d²s/dθ² over the turn: negative means a flat-faced follower cannot follow (cusp). */
export function flatFaceConvexity(p: CamParams): number {
  let least = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 720; i += 1) {
    const m = camMotion(p, (i / 720) * 2 * Math.PI);
    least = Math.min(least, p.baseRadius + m.s + m.d2s);
  }
  return least;
}

function range(issues: Issue[], key: keyof typeof CAM_LIMITS, value: number, message: string) {
  const lim = CAM_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min - 1e-12 || value > lim.max + 1e-12) {
    issues.push({ parameter: key, severity: 'error', message });
  }
}

export const camFollowerModel: SimModel<CamParams, CamOutputs> = {
  id: 'm07.cam-follower',
  modelClass: 'dynamic',
  defaults: CAM_PRESETS.course,
  stateLabels: ['θ [rad]'],
  assumptions: [
    'Plate (disc) cam turning clockwise at constant speed; radial follower (no offset) kept in contact by a spring or gravity.',
    'Uniform velocity is the motion law taught in the course. Simple harmonic, uniform acceleration and cycloidal motion, and the pressure angle, are extensions.',
    'With uniform velocity the follower velocity jumps at the start and end of each rise and return, so the acceleration there is theoretically infinite; it is shown as zero inside the segments.',
    'Rigid cam and follower: no follower jump, spring dynamics or friction.',
    'Simplified educational model: it is not a substitute for cam design software.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    range(issues, 'lift', p.lift, 'The lift must be between 1 and 100 mm.');
    range(issues, 'riseAngle', p.riseAngle, 'The rise angle must be between 10° and 350°.');
    range(issues, 'dwellAngle', p.dwellAngle, 'The dwell angle must be between 0° and 340°.');
    range(issues, 'returnAngle', p.returnAngle, 'The return angle must be between 10° and 350°.');
    range(
      issues,
      'baseRadius',
      p.baseRadius,
      'The base-circle radius must be between 10 and 200 mm.',
    );
    range(issues, 'camSpeed', p.camSpeed, 'The cam speed must be between 0 and about 950 rpm.');
    if (p.follower === 'roller') {
      range(
        issues,
        'rollerRadius',
        p.rollerRadius,
        'The roller radius must be between 2 and 50 mm.',
      );
    }
    if (p.riseAngle + p.dwellAngle + p.returnAngle > 2 * Math.PI + 1e-9) {
      issues.push({
        parameter: 'returnAngle',
        severity: 'error',
        message:
          'Rise, dwell and return together cannot exceed 360°: the follower must be back at the start after one turn.',
      });
    }
    if (issues.length === 0) {
      if (p.follower !== 'flat' && maxPressureAngle(p) > degToRad(30)) {
        issues.push({
          parameter: 'baseRadius',
          severity: 'warning',
          message: `The pressure angle reaches ${radToDeg(maxPressureAngle(p)).toFixed(1)}°, above about 30°: the follower would tend to jam in its guide. Use a larger base circle or a longer rise angle.`,
        });
      }
      if (p.follower === 'flat' && flatFaceConvexity(p) < 0) {
        issues.push({
          parameter: 'baseRadius',
          severity: 'warning',
          message:
            'The profile needed by a flat-faced follower is not convex (it has a cusp), so the follower cannot follow it. Use a larger base circle.',
        });
      }
    }
    return issues;
  },

  init() {
    return [0];
  },

  derivatives(_t, _s, p) {
    return [p.camSpeed];
  },

  fastestTimeConstant(p) {
    // About 0.6° of cam rotation per step, so traces and the diagram stay smooth.
    return 0.1 / Math.max(p.camSpeed, 0.1);
  },

  project(s) {
    const twoPi = 2 * Math.PI;
    const th = s[0] as number;
    return [th >= twoPi ? th - twoPi * Math.floor(th / twoPi) : th];
  },

  outputs(_t, s, p) {
    const theta = s[0] as number;
    const m = camMotion(p, theta);
    const prime = p.baseRadius + (p.follower === 'roller' ? p.rollerRadius : 0);
    return {
      camAngleDeg: radToDeg(theta),
      displacement: m.s,
      displacementMm: mToMm(m.s),
      velocity: m.ds * p.camSpeed,
      acceleration: m.d2s * p.camSpeed * p.camSpeed,
      segment: m.segment,
      pressureAngleDeg: p.follower === 'flat' ? 0 : radToDeg(pressureAngle(m.ds, m.s, prime)),
      followerHeight: prime + m.s,
      camSpeedRpm: radPerSecToRpm(p.camSpeed),
    };
  },
};
