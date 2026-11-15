/**
 * M10 hydraulics and electrohydraulics: the course Lab 4a (hand-lever valves)
 * and Lab 4b (solenoid valves, relay control) circuits on the Festo 16/10/200
 * cylinder.
 *
 * State [x, K1, K2, K3]: rod extension [m] (0 = retracted) and relay states.
 * In the vertical circuits the cylinder hangs rod down with the weight on the
 * rod, so the load assists extension (lowering) and opposes retraction (raising).
 * Each stroke is solved by `hydraulicStroke` (VADL's quasi-static flow model,
 * calibrated to the course's 0.05 MPa line resistance at 2 L/min).
 *
 * Model document: docs/simulation-models/m10-electrohydraulics.md.
 */
import {
  annulusArea,
  coilCurrent,
  drivePower,
  hydraulicPower,
  hydraulicStroke,
  loadPressure,
  oilFlow,
  oilPressureDrop,
  pistonArea,
  reliefFlow,
  seriesArea,
  type HydraulicStroke,
} from '../equations/fluidPower';
import { evaluateLadder, NC, NO, type Ladder, type LadderFault } from '../logic/ladder';
import type { Issue, SimModel } from '../types';
import { mToMm } from '../units';

export type HydraulicCircuitId =
  '4a-ex1' | '4a-ex2' | '4a-ex3' | '4b-ex1' | '4b-ex2a' | '4b-ex2b' | '4b-ex2c';

export const HYDRAULIC_CIRCUITS: readonly HydraulicCircuitId[] = [
  '4a-ex1',
  '4a-ex2',
  '4a-ex3',
  '4b-ex1',
  '4b-ex2a',
  '4b-ex2b',
  '4b-ex2c',
];

/** Valve and line passage, calibrated to the course: 0.05 MPa at 2 L/min (TP501 p.79) [m²]. */
export const HYDRAULIC_PASSAGE_AREA = 3.33333e-5 / Math.sqrt((2 * 5e4) / 870);
/** One-way flow control fully open [m²] (VADL assumption). */
export const HYDRAULIC_FLOW_CONTROL_MAX = 3e-6;
/** Non-return valve cracking pressure (Festo 548618) [Pa]. */
export const CHECK_VALVE_PRESSURE = 0.6e6;
/** A vented chamber (connected straight to the tank line) [m²]. */
const VENT = 1e-3;

export interface HydraulicsParams {
  readonly circuit: HydraulicCircuitId;
  /** Pump running (true) or circulating to tank through the bypass 0V1 (false). */
  readonly pumpOn: boolean;
  /** Hand lever actuated (Lab 4a). */
  readonly lever: boolean;
  /** Push buttons S1, S2 and the lowering switch S3 (Lab 4b). */
  readonly s1: boolean;
  readonly s2: boolean;
  readonly s3: boolean;
  readonly fault: LadderFault;
  /** Pump flow [m³/s]; the labs calculate with 2 L/min (the unit gives about 2.2 L/min). */
  readonly pumpFlow: number;
  readonly reliefSetting: number;
  readonly bore: number;
  readonly rod: number;
  readonly stroke: number;
  /** Load: the 9 kg weight (90 N) in the vertical circuits; an opposing force when horizontal [N]. */
  readonly loadForce: number;
  readonly throttle: number;
}

export interface HydraulicsOutputs {
  readonly [key: string]: number;
  readonly positionMm: number;
  readonly velocity: number;
  readonly pumpPressure: number;
  readonly capPressure: number;
  readonly rodPressure: number;
  readonly cylinderFlow: number;
  readonly reliefFlow: number;
  readonly hydraulicPower: number;
  readonly drivePower: number;
  readonly loadPressure: number;
  readonly cavitation: number;
  /** 0 extend, 1 retract (raise), 2 lower by weight, 3 lower with pump flow joining, 4 hold. */
  readonly mode: number;
  readonly coilCurrentTotal: number;
  readonly areaRatio: number;
  readonly passageDrop: number;
}

/** Whether the cylinder hangs vertically with the weight (Lab 4a Ex 1–2, Lab 4b Ex 2). */
export function isVertical(c: HydraulicCircuitId): boolean {
  return c !== '4a-ex3' && c !== '4b-ex1';
}

/** Whether the circuit is worked by solenoids from a relay ladder (Lab 4b). */
export function isElectrical(c: HydraulicCircuitId): boolean {
  return c.startsWith('4b');
}

/** Relay ladders of the Lab 4b circuits (1M1 extend/raise, 1M2 lower). */
export function hydraulicLadder(c: HydraulicCircuitId): Ladder {
  switch (c) {
    case '4b-ex1':
      return [
        { branches: [[NO('S1')]], coil: 'K1' },
        { branches: [[NO('K1')]], coil: '1M1' },
      ];
    case '4b-ex2a':
      return [
        { branches: [[NO('S1')], [NO('S2')]], coil: 'K1' },
        { branches: [[NO('K1')]], coil: '1M1' },
        { branches: [[NO('S3')]], coil: '1M2' },
      ];
    case '4b-ex2b':
      return [
        { branches: [[NO('S1'), NO('S2')]], coil: 'K1' },
        { branches: [[NO('K1')]], coil: '1M1' },
        { branches: [[NO('S3')]], coil: '1M2' },
      ];
    case '4b-ex2c':
      return [
        {
          branches: [
            [NO('S1'), NC('S2')],
            [NO('K1'), NC('S2')],
          ],
          coil: 'K1',
        },
        { branches: [[NO('K1')]], coil: '1M1' },
        { branches: [[NO('S3'), NC('K1')]], coil: '1M2' },
      ];
    default:
      return [];
  }
}

const BASE = {
  pumpOn: false,
  lever: false,
  s1: false,
  s2: false,
  s3: false,
  fault: 'none',
  pumpFlow: 2 / 60_000,
  reliefSetting: 5e6,
  bore: 0.016,
  rod: 0.01,
  stroke: 0.2,
  loadForce: 90,
  throttle: 0.5,
} as const;

/** Course circuits (Festo TP501 Ex 5–7; TP601 Ex 4–5) with the lab settings. */
export const HYDRAULIC_PRESETS = {
  '4a-ex1': { ...BASE, circuit: '4a-ex1' },
  '4a-ex2': { ...BASE, circuit: '4a-ex2' },
  '4a-ex3': { ...BASE, circuit: '4a-ex3', loadForce: 0 },
  '4b-ex1': { ...BASE, circuit: '4b-ex1', loadForce: 0 },
  '4b-ex2a': { ...BASE, circuit: '4b-ex2a' },
  '4b-ex2b': { ...BASE, circuit: '4b-ex2b' },
  '4b-ex2c': { ...BASE, circuit: '4b-ex2c' },
} satisfies Record<HydraulicCircuitId, HydraulicsParams>;

type Mode = 'extend' | 'retract' | 'lower' | 'lower-pumped' | 'hold';

interface Control {
  readonly mode: Mode;
  readonly coils: Readonly<Record<string, boolean>>;
  readonly relays: { K1: boolean; K2: boolean; K3: boolean };
  readonly rungsOn: readonly boolean[];
}

function control(p: HydraulicsParams, relays: { K1: boolean; K2: boolean; K3: boolean }): Control {
  const none = { '1M1': false, '1M2': false };
  const c = p.circuit;
  if (!isElectrical(c)) {
    let mode: Mode = 'hold';
    if (c === '4a-ex1')
      mode = p.lever ? (p.pumpOn ? 'lower-pumped' : 'lower') : p.pumpOn ? 'retract' : 'hold';
    if (c === '4a-ex2') mode = p.lever ? (p.pumpOn ? 'retract' : 'hold') : 'lower';
    if (c === '4a-ex3') mode = p.pumpOn ? (p.lever ? 'extend' : 'retract') : 'hold';
    return { mode, coils: none, relays, rungsOn: [] };
  }
  const r = evaluateLadder(
    hydraulicLadder(c),
    { S1: p.s1, S2: p.s2, S3: p.s3 },
    { '1B1': false, '1B2': false, '2B1': false, '2B2': false },
    relays,
    false,
    p.fault,
  );
  let mode: Mode = 'hold';
  if (c === '4b-ex1') mode = p.pumpOn ? (r.coils['1M1'] ? 'extend' : 'retract') : 'hold';
  else if (r.coils['1M1'] && p.pumpOn) mode = 'retract';
  else if (r.coils['1M2']) mode = 'lower';
  return { mode, coils: r.coils, relays: r.relays, rungsOn: r.rungsOn };
}

function areas(p: HydraulicsParams) {
  return { cap: pistonArea(p.bore), rod: annulusArea(p.bore, p.rod) };
}

const fcvArea = (p: HydraulicsParams) =>
  seriesArea(HYDRAULIC_PASSAGE_AREA, HYDRAULIC_FLOW_CONTROL_MAX * Math.max(p.throttle, 1e-6));

/** Stroke for a mode at position x (blocked at the ends). */
export function hydraulicState(
  p: HydraulicsParams,
  mode: Mode,
  x: number,
): HydraulicStroke & { readonly direction: number } {
  const { cap, rod } = areas(p);
  const vertical = isVertical(p.circuit);
  const q = p.pumpOn ? p.pumpFlow : 0;
  const atEnd = (dir: number) => (dir > 0 && x >= p.stroke) || (dir < 0 && x <= 0);
  const blocked = 1e12;
  const deadHead = (): HydraulicStroke =>
    hydraulicStroke({
      pumpFlow: q,
      reliefSetting: p.reliefSetting,
      reliefRatedFlow: p.pumpFlow,
      inArea: cap,
      outArea: rod,
      opposingForce: blocked,
      inPathArea: HYDRAULIC_PASSAGE_AREA,
      outPathArea: HYDRAULIC_PASSAGE_AREA,
      checkValve: 0,
    });
  const hold = (): HydraulicStroke & { direction: number } => {
    const d = deadHead();
    return {
      ...d,
      speed: 0,
      direction: 0,
      inPressure: 0,
      outPressure: vertical ? loadPressure(p.loadForce, rod) : 0,
      pumpPressure: q > 0 ? d.pumpPressure : 0,
      reliefFlow: q,
    };
  };
  switch (mode) {
    case 'hold':
      return hold();
    case 'extend': {
      const s = hydraulicStroke({
        pumpFlow: q,
        reliefSetting: p.reliefSetting,
        reliefRatedFlow: p.pumpFlow,
        inArea: cap,
        outArea: rod,
        opposingForce: atEnd(1) ? blocked : p.loadForce,
        inPathArea: p.circuit === '4b-ex1' ? fcvArea(p) : HYDRAULIC_PASSAGE_AREA,
        outPathArea: HYDRAULIC_PASSAGE_AREA,
        checkValve: 0,
      });
      return { ...s, direction: s.speed > 0 ? 1 : 0 };
    }
    case 'retract': {
      const s = hydraulicStroke({
        pumpFlow: q,
        reliefSetting: p.reliefSetting,
        reliefRatedFlow: p.pumpFlow,
        inArea: rod,
        outArea: cap,
        opposingForce: atEnd(-1) ? blocked : p.loadForce,
        inPathArea: HYDRAULIC_PASSAGE_AREA,
        outPathArea: vertical ? VENT : HYDRAULIC_PASSAGE_AREA,
        checkValve: vertical ? CHECK_VALVE_PRESSURE : 0,
      });
      // Swap so that "in" and "out" refer to the cap and rod ports for display.
      return {
        ...s,
        inPressure: s.outPressure,
        outPressure: s.inPressure,
        direction: s.speed > 0 ? -1 : 0,
      };
    }
    case 'lower':
    case 'lower-pumped': {
      if (atEnd(1)) return hold();
      // The weight drives the piston down; the annulus empties through the flow control.
      const pB = loadPressure(p.loadForce, rod);
      const shared = mode === 'lower-pumped' ? q : 0;
      const qOut = oilFlow(fcvArea(p), pB);
      const v = (qOut - shared) / rod;
      const pump = mode === 'lower-pumped' ? pB : q > 0 ? deadHead().pumpPressure : 0;
      return {
        speed: Math.abs(v),
        direction: v >= 0 ? 1 : -1,
        pumpPressure: pump,
        inPressure: 0,
        outPressure: pB,
        reliefFlow: mode === 'lower' && q > 0 ? q : reliefFlow(pump, p.reliefSetting, p.pumpFlow),
        cavitation: false,
      };
    }
  }
}

function relaysOf(s: readonly number[]) {
  return { K1: (s[1] as number) > 0.5, K2: (s[2] as number) > 0.5, K3: (s[3] as number) > 0.5 };
}

export const hydraulicsModel: SimModel<HydraulicsParams, HydraulicsOutputs> = {
  id: 'm10.electrohydraulics',
  modelClass: 'dynamic',
  defaults: HYDRAULIC_PRESETS['4a-ex2'],
  stateLabels: ['x [m]', 'K1', 'K2', 'K3'],
  assumptions: [
    'Hydraulic relations as in the course (Festo): v = q/A, load pressure p = F/A, area ratio, F = A_P·p1 − A_PR·p2, power P = p·q and drive power p·q/η with η = 0.7.',
    "VADL's quasi-static flow model: incompressible oil (870 kg/m³) through orifices; the valve and line passage is calibrated to the course measurement of 0.05 MPa at 2 L/min; piston inertia and friction neglected.",
    "Relief valve with the course's measured behaviour: it starts to open 0.4 MPa below its setting and passes the full pump flow at the setting. Non-return valve opens at 0.6 MPa.",
    'In the vertical circuits the 9 kg weight (90 N) hangs on the rod; the unused piston chamber is vented straight to tank.',
    'Lab 4b Exercise 2 follows the UTeM sequence: buttons raise (OR, AND or latch), the switch S3 lowers, otherwise the load is held (pending lecturer question L-24).',
    'Constant pump flow (2 L/min as in the lab calculations; the unit delivers about 2.2 L/min). Ideal relays and solenoids.',
    'Simplified educational model: it is not a substitute for FluidSIM or for the laboratory hardware.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    const bad = (parameter: string, message: string) =>
      issues.push({ parameter, severity: 'error', message });
    if (!(p.pumpFlow > 0 && p.pumpFlow <= 10 / 60_000))
      bad('pumpFlow', 'Pump flow must be between 0 and 10 L/min.');
    if (!(p.reliefSetting >= 0.5e6 && p.reliefSetting <= 6e6))
      bad(
        'reliefSetting',
        'The relief valve can be set between 0.5 and 6 MPa (system limit 6 MPa).',
      );
    if (!(p.bore >= 0.008 && p.bore <= 0.1)) bad('bore', 'Bore must be between 8 and 100 mm.');
    if (!(p.rod >= 0.004 && p.rod < p.bore))
      bad('rod', 'The rod must be at least 4 mm and smaller than the bore.');
    if (!(p.stroke >= 0.02 && p.stroke <= 1))
      bad('stroke', 'Stroke must be between 20 and 1000 mm.');
    if (!(p.loadForce >= 0 && p.loadForce <= 5000))
      bad('loadForce', 'Load must be between 0 and 5000 N.');
    if (!(p.throttle >= 0.01 && p.throttle <= 1))
      bad('throttle', 'Flow-control opening must be between 1 and 100 %.');
    if (issues.length === 0 && isVertical(p.circuit)) {
      const needed = loadPressure(p.loadForce, annulusArea(p.bore, p.rod)) + CHECK_VALVE_PRESSURE;
      if (needed >= p.reliefSetting - 0.4e6) {
        issues.push({
          parameter: 'loadForce',
          severity: 'warning',
          message:
            'Raising this load needs more pressure than the relief valve allows: the pump flow will pass over the relief valve and the load will not rise.',
        });
      }
    }
    return issues;
  },

  init() {
    return [0, 0, 0, 0];
  },

  derivatives(_t, s, p) {
    const x = s[0] as number;
    const c = control(p, relaysOf(s));
    const st = hydraulicState(p, c.mode, x);
    const v = st.direction * st.speed;
    if ((v > 0 && x >= p.stroke) || (v < 0 && x <= 0)) return [0, 0, 0, 0];
    return [v, 0, 0, 0];
  },

  project(s, p) {
    const x = Math.min(p.stroke, Math.max(0, s[0] as number));
    const c = control(p, relaysOf(s));
    return [x, c.relays.K1 ? 1 : 0, c.relays.K2 ? 1 : 0, c.relays.K3 ? 1 : 0];
  },

  fastestTimeConstant(p) {
    const { cap, rod } = areas(p);
    const vMax = Math.max(
      p.pumpFlow / rod,
      p.pumpFlow / cap,
      oilFlow(fcvArea(p), loadPressure(p.loadForce, rod)) / rod,
      1e-3,
    );
    return (0.1 * p.stroke) / vMax;
  },

  outputs(_t, s, p) {
    const x = s[0] as number;
    const { cap, rod } = areas(p);
    const c = control(p, relaysOf(s));
    const st = hydraulicState(p, c.mode, x);
    const v = st.direction * st.speed;
    const q = p.pumpOn ? p.pumpFlow : 0;
    const out: Record<string, number> = {};
    for (const [k, on] of Object.entries(c.coils)) out[`coil_${k}`] = on ? 1 : 0;
    c.rungsOn.forEach((on, i) => {
      out[`rung${i}`] = on ? 1 : 0;
    });
    const solenoids = (c.coils['1M1'] ? 1 : 0) + (c.coils['1M2'] ? 1 : 0);
    const relaysOn = (c.coils.K1 ? 1 : 0) + (c.coils.K2 ? 1 : 0);
    // Cap and rod port pressures: "in" is the cap side for extension, after the swap for retraction.
    const capP = c.mode === 'extend' ? st.inPressure : c.mode === 'retract' ? st.inPressure : 0;
    const rodP =
      c.mode === 'extend' ? st.outPressure : c.mode === 'retract' ? st.outPressure : st.outPressure;
    return {
      ...out,
      mode: ['extend', 'retract', 'lower', 'lower-pumped', 'hold'].indexOf(c.mode),
      positionMm: mToMm(x),
      velocity: v,
      pumpPressure: st.pumpPressure,
      capPressure: capP,
      rodPressure: rodP,
      cylinderFlow: Math.abs(v) * (v > 0 ? cap : rod),
      reliefFlow: st.reliefFlow,
      hydraulicPower: hydraulicPower(st.pumpPressure, q),
      drivePower: drivePower(st.pumpPressure, q),
      loadPressure: isVertical(p.circuit) ? loadPressure(p.loadForce, rod) : 0,
      passageDrop: oilPressureDrop(HYDRAULIC_PASSAGE_AREA, p.pumpFlow),
      cavitation: st.cavitation ? 1 : 0,
      coilCurrentTotal: solenoids * coilCurrent(24, 48) + relaysOn * coilCurrent(24, 580),
      areaRatio: cap / rod,
    };
  },
};
