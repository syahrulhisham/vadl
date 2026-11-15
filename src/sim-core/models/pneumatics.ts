/**
 * M08 pneumatics: the course Lab 2 circuits with one cylinder.
 *
 * State [x, m]: piston position [m] and the double-pilot (memory) valve state
 * (0 or 1). The valve logic (`pneumaticSignals`) decides which port is
 * pressurised; the cylinder moves at the quasi-static speed of
 * `cylinderStrokes` until it reaches an end. Forces follow the course (10 %
 * friction); the speed model is VADL's own.
 *
 * Model document: docs/simulation-models/m08-pneumatics.md.
 * Reference cases: docs/reference-cases/fluid-power.md.
 */
import { pistonArea, theoreticalForce } from '../equations/fluidPower';
import {
  hasMemoryValve,
  isSingleActing,
  memoryValve,
  pneumaticSignals,
  type PneumaticCircuitId,
} from '../logic/pneumaticLogic';
import type { Issue, SimModel } from '../types';
import { barToPa, mToMm, paToBar } from '../units';
import {
  cylinderStrokes,
  END_TOLERANCE,
  type PneumaticCylinderSpec,
  type ThrottleMode,
} from './pneumaticCylinder';

export interface PneumaticsParams {
  readonly circuit: PneumaticCircuitId;
  /** Push buttons and selector switch (operated live). */
  readonly s1: boolean;
  readonly s2: boolean;
  readonly selector: boolean;
  /** Regulated working pressure [Pa gauge]. */
  readonly supply: number;
  readonly bore: number;
  readonly rod: number;
  readonly stroke: number;
  readonly springForce: number;
  readonly friction: number;
  readonly loadForce: number;
  readonly throttle: number;
  readonly throttleMode: ThrottleMode;
}

export interface PneumaticsOutputs {
  readonly [key: string]: number;
  readonly position: number;
  readonly positionMm: number;
  readonly velocity: number;
  readonly capPressureBar: number;
  readonly rodPressureBar: number;
  readonly extendForce: number;
  readonly retractForce: number;
  readonly theoreticalForce: number;
  readonly drive: number;
  readonly atRetracted: number;
  readonly atExtended: number;
  readonly memory: number;
  readonly extendTime: number;
  readonly retractTime: number;
}

export const PNEUMATIC_LIMITS = {
  supply: { min: 0, max: 6e5 },
  bore: { min: 0.008, max: 0.1 },
  rod: { min: 0.003, max: 0.04 },
  stroke: { min: 0.01, max: 0.5 },
  springForce: { min: 0, max: 200 },
  friction: { min: 0, max: 0.3 },
  loadForce: { min: 0, max: 2000 },
  throttle: { min: 0.01, max: 1 },
} as const;

const FESTO = {
  s1: false,
  s2: false,
  selector: false,
  supply: barToPa(6),
  bore: 0.02,
  rod: 0.008,
  stroke: 0.1,
  springForce: 13.6,
  friction: 0.1,
  loadForce: 0,
  throttle: 1,
  throttleMode: 'meter-out',
} as const;

/**
 * Lab 2 exercises with the Festo TP101 cylinders (20 mm bore, 8 mm rod, 13.6 N
 * spring); stroke 100 mm assumed (L-21). Pressures as in the Festo exercises.
 */
export const PNEUMATIC_PRESETS = {
  direct: { ...FESTO, circuit: 'direct', throttleMode: 'none' },
  indirect: { ...FESTO, circuit: 'indirect', throttleMode: 'none', supply: barToPa(5) },
  or: { ...FESTO, circuit: 'or', throttleMode: 'none' },
  'and-memory': { ...FESTO, circuit: 'and-memory', supply: barToPa(3.5), throttle: 0.3 },
  'and-or': { ...FESTO, circuit: 'and-or', supply: barToPa(3), throttle: 0.3 },
} satisfies Record<PneumaticCircuitId, PneumaticsParams>;

const specs = new WeakMap<PneumaticsParams, PneumaticCylinderSpec>();

/** The cylinder of these parameters (one object per parameter set, so its speeds are cached). */
export function pneumaticSpec(p: PneumaticsParams): PneumaticCylinderSpec {
  let s = specs.get(p);
  if (!s) {
    s = {
      bore: p.bore,
      rod: p.rod,
      stroke: p.stroke,
      singleActing: isSingleActing(p.circuit),
      springForce: p.springForce,
      friction: p.friction,
      loadForce: p.loadForce,
      throttle: p.throttle,
      throttleMode: p.throttleMode,
    };
    specs.set(p, s);
  }
  return s;
}

/** Port command: true = cap side pressurised (extend). */
function driveOf(
  p: PneumaticsParams,
  x: number,
  memory: number,
): { drive: boolean; set: boolean; reset: boolean } {
  const sig = pneumaticSignals(p.circuit, p, x <= END_TOLERANCE, x >= p.stroke - END_TOLERANCE);
  if (hasMemoryValve(p.circuit)) {
    return { drive: memoryValve(memory > 0.5, sig.set, sig.reset), set: sig.set, reset: sig.reset };
  }
  return { drive: sig.drive, set: false, reset: false };
}

function range(
  issues: Issue[],
  key: keyof typeof PNEUMATIC_LIMITS,
  value: number,
  message: string,
) {
  const lim = PNEUMATIC_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    issues.push({ parameter: key, severity: 'error', message });
  }
}

export const pneumaticsModel: SimModel<PneumaticsParams, PneumaticsOutputs> = {
  id: 'm08.pneumatics',
  modelClass: 'dynamic',
  defaults: PNEUMATIC_PRESETS.direct,
  stateLabels: ['x [m]', 'memory [0/1]'],
  assumptions: [
    'Forces as in the course (Festo): F = p·A with friction about 10 % of the theoretical force; single-acting cylinders subtract the return spring (13.6 N on the lab cylinder).',
    "Piston speed is VADL's own quasi-static model (the course gives no speed formula): isothermal air flowing through the valve passage and the one-way flow control as orifices, piston inertia, air compressibility and end cushioning neglected.",
    'The external load opposes the motion in both directions, like friction.',
    'Valves switch instantly and seal perfectly; a double-pilot valve keeps its position while both pilot signals are present.',
    'The lab cylinder stroke is not stated in the course materials; 100 mm is assumed.',
    'Gauge pressures throughout. The Festo equipment is limited to 6 bar.',
    'Simplified educational model: it is not a substitute for FluidSIM or for the laboratory hardware.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    range(
      issues,
      'supply',
      p.supply,
      'Working pressure must be between 0 and 6 bar (Festo equipment limit).',
    );
    range(issues, 'bore', p.bore, 'Bore must be between 8 and 100 mm.');
    range(issues, 'rod', p.rod, 'Rod diameter must be between 3 and 40 mm.');
    range(issues, 'stroke', p.stroke, 'Stroke must be between 10 and 500 mm.');
    range(issues, 'springForce', p.springForce, 'Spring force must be between 0 and 200 N.');
    range(
      issues,
      'friction',
      p.friction,
      'Friction must be between 0 and 30 % of the theoretical force.',
    );
    range(issues, 'loadForce', p.loadForce, 'Load must be between 0 and 2000 N.');
    range(issues, 'throttle', p.throttle, 'Flow-control opening must be between 1 and 100 %.');
    if (issues.length === 0 && p.rod >= p.bore) {
      issues.push({
        parameter: 'rod',
        severity: 'error',
        message: 'The rod must be smaller than the bore.',
      });
    }
    if (issues.length === 0) {
      const st = cylinderStrokes(pneumaticSpec(p), p.supply);
      if (st.extend.speed === 0 || st.retract.speed === 0) {
        issues.push({
          parameter: 'loadForce',
          severity: 'warning',
          message:
            'At this pressure the cylinder cannot overcome the load, friction and spring in one direction: it will stall.',
        });
      }
    }
    return issues;
  },

  init() {
    return [0, 0];
  },

  derivatives(_t, s, p) {
    const x = s[0] as number;
    const d = driveOf(p, x, s[1] as number);
    const st = cylinderStrokes(pneumaticSpec(p), p.supply);
    const v = d.drive ? st.extend.speed : -st.retract.speed;
    if ((v > 0 && x >= p.stroke) || (v < 0 && x <= 0)) return [0, 0];
    return [v, 0];
  },

  project(s, p) {
    const x = Math.min(p.stroke, Math.max(0, s[0] as number));
    const d = driveOf(p, x, s[1] as number);
    return [x, hasMemoryValve(p.circuit) ? (d.drive ? 1 : 0) : 0];
  },

  fastestTimeConstant(p) {
    const st = cylinderStrokes(pneumaticSpec(p), p.supply);
    const v = Math.max(st.extend.speed, st.retract.speed, 1e-3);
    // About 1 % of the stroke per step, so end positions and sensors are caught.
    return (0.1 * p.stroke) / v;
  },

  outputs(_t, s, p) {
    const x = s[0] as number;
    const d = driveOf(p, x, s[1] as number);
    const st = cylinderStrokes(pneumaticSpec(p), p.supply);
    const atRetracted = x <= END_TOLERANCE;
    const atExtended = x >= p.stroke - END_TOLERANCE;
    const moving = d.drive ? !atExtended : !atRetracted;
    const stroke = d.drive ? st.extend : st.retract;
    const single = isSingleActing(p.circuit);
    // Gauges: while moving, the stroke pressures; at rest, supply on the pressurised side.
    let cap: number;
    let rodSide: number;
    if (d.drive) {
      cap = moving ? stroke.drivePressure : p.supply;
      rodSide = single ? 0 : moving ? stroke.exhaustPressure : 0;
    } else {
      cap = moving ? stroke.exhaustPressure : 0;
      rodSide = single ? 0 : moving ? stroke.drivePressure : p.supply;
    }
    return {
      position: x,
      positionMm: mToMm(x),
      velocity: moving ? (d.drive ? stroke.speed : -stroke.speed) : 0,
      capPressureBar: paToBar(cap),
      rodPressureBar: paToBar(rodSide),
      extendForce: st.extendForce,
      retractForce: st.retractForce,
      theoreticalForce: theoreticalForce(p.supply, pistonArea(p.bore)),
      drive: d.drive ? 1 : 0,
      atRetracted: atRetracted ? 1 : 0,
      atExtended: atExtended ? 1 : 0,
      memory: s[1] as number,
      extendTime: st.extend.speed > 0 ? p.stroke / st.extend.speed : Number.NaN,
      retractTime: st.retract.speed > 0 ? p.stroke / st.retract.speed : Number.NaN,
    };
  },
};
