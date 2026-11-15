/**
 * Pneumatic cylinder used by M08 and M09: areas, effective forces (course: 10 %
 * friction) and the stroke speeds of VADL's quasi-static flow model, cached per
 * parameter set because they do not change during a stroke.
 */
import {
  annulusArea,
  effectiveForce,
  pistonArea,
  pneumaticStroke,
  seriesArea,
  springStroke,
  type PneumaticStroke,
} from '../equations/fluidPower';

/** Effective flow area of a valve passage with its fittings and tubing [m²] (VADL assumption). */
export const VALVE_PASSAGE_AREA = 1.5e-6;
/** Effective flow area of a one-way flow control valve fully open [m²] (VADL assumption). */
export const FLOW_CONTROL_MAX_AREA = 2e-6;
/** The vented side of a single-acting cylinder breathes freely [m²]. */
const VENT_AREA = 1e-4;

export type ThrottleMode = 'meter-out' | 'meter-in' | 'none';

export interface PneumaticCylinderSpec {
  readonly bore: number;
  readonly rod: number;
  readonly stroke: number;
  readonly singleActing: boolean;
  /** Return-spring force of a single-acting cylinder [N] (Festo: 13.6 N). */
  readonly springForce: number;
  /** Friction as a fraction of the theoretical force (course: 0.1). */
  readonly friction: number;
  /** External load opposing the motion in either direction [N]. */
  readonly loadForce: number;
  /** One-way flow control opening, 0…1 (1 = fully open). */
  readonly throttle: number;
  readonly throttleMode: ThrottleMode;
}

export interface CylinderStrokes {
  readonly extend: PneumaticStroke;
  readonly retract: PneumaticStroke;
  readonly capArea: number;
  readonly rodArea: number;
  readonly extendForce: number;
  readonly retractForce: number;
}

const cache = new WeakMap<object, Map<number, CylinderStrokes>>();

/** Stroke speeds and forces for this cylinder at the given supply pressure [Pa gauge]. */
export function cylinderStrokes(spec: PneumaticCylinderSpec, supply: number): CylinderStrokes {
  let bySupply = cache.get(spec);
  if (!bySupply) {
    bySupply = new Map();
    cache.set(spec, bySupply);
  }
  const hit = bySupply.get(supply);
  if (hit) return hit;
  const cap = pistonArea(spec.bore);
  const rodSide = annulusArea(spec.bore, spec.rod);
  const fcv = seriesArea(VALVE_PASSAGE_AREA, FLOW_CONTROL_MAX_AREA * Math.max(spec.throttle, 1e-6));
  const throttled = spec.throttleMode === 'none' ? VALVE_PASSAGE_AREA : fcv;
  const inlet = spec.throttleMode === 'meter-in' ? throttled : VALVE_PASSAGE_AREA;
  const outlet = spec.throttleMode === 'meter-out' ? throttled : VALVE_PASSAGE_AREA;
  let result: CylinderStrokes;
  if (spec.singleActing) {
    result = {
      extend: pneumaticStroke(
        supply,
        cap,
        cap,
        spec.friction * supply * cap,
        spec.loadForce + spec.springForce,
        inlet,
        VENT_AREA,
      ),
      retract: springStroke(
        cap,
        spec.springForce,
        spec.friction * spec.springForce,
        spec.loadForce,
        outlet,
      ),
      capArea: cap,
      rodArea: rodSide,
      extendForce: effectiveForce(supply, cap, spec.friction, spec.springForce),
      retractForce: spec.springForce,
    };
  } else {
    result = {
      extend: pneumaticStroke(
        supply,
        cap,
        rodSide,
        spec.friction * supply * cap,
        spec.loadForce,
        inlet,
        outlet,
      ),
      retract: pneumaticStroke(
        supply,
        rodSide,
        cap,
        spec.friction * supply * rodSide,
        spec.loadForce,
        inlet,
        outlet,
      ),
      capArea: cap,
      rodArea: rodSide,
      extendForce: effectiveForce(supply, cap, spec.friction),
      retractForce: effectiveForce(supply, rodSide, spec.friction),
    };
  }
  bySupply.set(supply, result);
  return result;
}

/** End-position sensing tolerance [m]: a sensor switches within 1 mm of the end. */
export const END_TOLERANCE = 1e-3;
