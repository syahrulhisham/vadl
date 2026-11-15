/**
 * M09 electro-pneumatics: a 24 V DC relay ladder controlling two cylinders.
 *
 * 1A1: double-acting 20/8 mm on a 5/2 solenoid valve, either single solenoid
 * (1M1, spring return) or double solenoid (1M1 extend, 1M2 retract, memory).
 * 2A1: single-acting 20 mm on a valve worked by 2M1, either a 3/2 normally
 * closed (energised → extend) or a 5/2 used on port 2 (energised → retract, so a
 * power failure extends it: Lab 3 Part C).
 *
 * State [x1, x2, K1, K2, K3, m1, tT]: positions [m], relay states, 1V1 memory,
 * timer elapsed [s]. The ladder is evaluated in `project` after each step with
 * sensors from the positions (1B1/2B1 retracted, 1B2/2B2 extended).
 *
 * Model document: docs/simulation-models/m09-electro-pneumatics.md.
 */
import { coilCurrent } from '../equations/fluidPower';
import {
  evaluateLadder,
  LADDER_PRESETS,
  type CoilName,
  type Ladder,
  type LadderFault,
  type LadderResult,
} from '../logic/ladder';
import { memoryValve } from '../logic/pneumaticLogic';
import type { Issue, SimModel } from '../types';
import { barToPa, mToMm } from '../units';
import { cylinderStrokes, END_TOLERANCE, type PneumaticCylinderSpec } from './pneumaticCylinder';

export type Valve1Kind = 'single' | 'double';
export type Valve2Kind = 'nc' | 'no';

export interface ElectroPneumaticsParams {
  readonly ladder: Ladder;
  readonly s1: boolean;
  readonly s2: boolean;
  readonly s3: boolean;
  readonly fault: LadderFault;
  readonly valve1: Valve1Kind;
  readonly valve2: Valve2Kind;
  /** On-delay timer setting [s]. */
  readonly timerDelay: number;
  readonly supply: number;
  readonly stroke: number;
  readonly throttle: number;
  /** Supply voltage [V] and coil resistances [Ω]. */
  readonly voltage: number;
  readonly relayResistance: number;
  readonly solenoidResistance: number;
}

export interface ElectroPneumaticsOutputs {
  readonly [key: string]: number;
  readonly x1Mm: number;
  readonly x2Mm: number;
  readonly v1: number;
  readonly v2: number;
  readonly supplyCurrent: number;
  readonly s1Current: number;
  readonly stable: number;
}

/** Electrical defaults (Festo TP201 examples): 24 V DC, relay 580 Ω, solenoid coil 48 Ω (12 W). */
const ELECTRICAL = { voltage: 24, relayResistance: 580, solenoidResistance: 48 } as const;

const BASE = {
  s1: false,
  s2: false,
  s3: false,
  fault: 'none',
  valve1: 'single',
  valve2: 'nc',
  timerDelay: 2,
  supply: barToPa(5),
  stroke: 0.1,
  throttle: 0.4,
  ...ELECTRICAL,
} as const;

/** Lab 3 Parts A–D and further circuits. */
export const ELECTRO_PNEUMATIC_PRESETS = {
  partA: { ...BASE, ladder: LADDER_PRESETS.partA },
  partB: { ...BASE, ladder: LADDER_PRESETS.partB },
  partC: { ...BASE, ladder: LADDER_PRESETS.partC, valve2: 'no' },
  partD: { ...BASE, ladder: LADDER_PRESETS.partD, valve1: 'double' },
  latch: { ...BASE, ladder: LADDER_PRESETS.latch },
  timer: { ...BASE, ladder: LADDER_PRESETS.timer },
  cycle: { ...BASE, ladder: LADDER_PRESETS.cycle, valve1: 'double' },
} satisfies Record<string, ElectroPneumaticsParams>;

export type ElectroPneumaticPresetName = keyof typeof ELECTRO_PNEUMATIC_PRESETS;

const specCache = new WeakMap<
  ElectroPneumaticsParams,
  { c1: PneumaticCylinderSpec; c2: PneumaticCylinderSpec }
>();

/** The two lab cylinders (Festo 20/8 mm; 13.6 N spring), meter-out at the throttle setting. */
export function electroPneumaticCylinders(p: ElectroPneumaticsParams) {
  let s = specCache.get(p);
  if (!s) {
    const common = {
      bore: 0.02,
      rod: 0.008,
      stroke: p.stroke,
      springForce: 13.6,
      friction: 0.1,
      loadForce: 0,
      throttle: p.throttle,
      throttleMode: 'meter-out',
    } as const;
    s = { c1: { ...common, singleActing: false }, c2: { ...common, singleActing: true } };
    specCache.set(p, s);
  }
  return s;
}

function sensorsOf(p: ElectroPneumaticsParams, x1: number, x2: number) {
  return {
    '1B1': x1 <= END_TOLERANCE,
    '1B2': x1 >= p.stroke - END_TOLERANCE,
    '2B1': x2 <= END_TOLERANCE,
    '2B2': x2 >= p.stroke - END_TOLERANCE,
  };
}

function evaluate(p: ElectroPneumaticsParams, s: readonly number[]): LadderResult {
  return evaluateLadder(
    p.ladder,
    { S1: p.s1, S2: p.s2, S3: p.s3 },
    sensorsOf(p, s[0] as number, s[1] as number),
    { K1: (s[2] as number) > 0.5, K2: (s[3] as number) > 0.5, K3: (s[4] as number) > 0.5 },
    (s[6] as number) >= p.timerDelay,
    p.fault,
  );
}

function directions(p: ElectroPneumaticsParams, r: LadderResult, m1: number) {
  const extend1 =
    p.valve1 === 'single' ? r.coils['1M1'] : memoryValve(m1 > 0.5, r.coils['1M1'], r.coils['1M2']);
  const extend2 = p.valve2 === 'nc' ? r.coils['2M1'] : !r.coils['2M1'];
  return { extend1, extend2 };
}

function move(x: number, extend: boolean, stroke: number, vExt: number, vRet: number): number {
  const v = extend ? vExt : -vRet;
  if ((v > 0 && x >= stroke) || (v < 0 && x <= 0)) return 0;
  return v;
}

/** Current drawn by each coil when energised [A]. */
export function coilCurrentOf(p: ElectroPneumaticsParams, coil: CoilName): number {
  return coil.startsWith('K') || coil === 'T1'
    ? coilCurrent(p.voltage, p.relayResistance)
    : coilCurrent(p.voltage, p.solenoidResistance);
}

export const electroPneumaticsModel: SimModel<ElectroPneumaticsParams, ElectroPneumaticsOutputs> = {
  id: 'm09.electro-pneumatics',
  modelClass: 'dynamic',
  defaults: ELECTRO_PNEUMATIC_PRESETS.partA,
  stateLabels: ['x1 [m]', 'x2 [m]', 'K1', 'K2', 'K3', '1V1 memory', 'timer [s]'],
  assumptions: [
    'Ideal 24 V DC relay ladder: contacts do not bounce and relays switch instantly compared with the cylinders; the circuit settles within each time step.',
    'Coils as in the Festo examples: relay 580 Ω, solenoid 48 Ω (0.5 A, 12 W). The real lab valves use current reduction (80 mA pick-up, 20 mA hold).',
    'Sensors switch within 1 mm of each end of the stroke.',
    "Cylinders and valves as in M08: Festo 20/8 mm cylinders, 10 % friction, VADL's quasi-static speed model with one-way flow controls (meter-out); 100 mm stroke assumed.",
    'Faults are idealised (an open contact, a dead coil, a welded contact, a broken wire or a lost supply).',
    'Simplified educational model: it is not a substitute for FluidSIM or for the laboratory hardware.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    const bad = (parameter: string, message: string) =>
      issues.push({ parameter, severity: 'error', message });
    if (!(p.supply >= 1e5 && p.supply <= 6e5))
      bad('supply', 'Working pressure must be between 1 and 6 bar.');
    if (!(p.stroke >= 0.01 && p.stroke <= 0.5))
      bad('stroke', 'Stroke must be between 10 and 500 mm.');
    if (!(p.throttle >= 0.01 && p.throttle <= 1))
      bad('throttle', 'Flow-control opening must be between 1 and 100 %.');
    if (!(p.timerDelay >= 0.1 && p.timerDelay <= 30))
      bad('timerDelay', 'Timer delay must be between 0.1 and 30 s.');
    if (!(p.voltage > 0 && p.relayResistance > 0 && p.solenoidResistance > 0))
      bad('voltage', 'Voltage and coil resistances must be positive.');
    if (p.ladder.length > 8) bad('ladder', 'A ladder has at most eight rungs here.');
    if (issues.length === 0) {
      const r = evaluate(p, electroPneumaticsModel.init(p));
      if (!r.stable) {
        issues.push({
          parameter: 'ladder',
          severity: 'warning',
          message:
            'The circuit does not settle: a relay switches itself off and on (it would chatter). Check for a relay contact in its own coil rung with the wrong sense.',
        });
      }
    }
    return issues;
  },

  init(p) {
    return [0, p.valve2 === 'no' ? p.stroke : 0, 0, 0, 0, 0, 0];
  },

  derivatives(_t, s, p) {
    const r = evaluate(p, s);
    const d = directions(p, r, s[5] as number);
    const { c1, c2 } = electroPneumaticCylinders(p);
    const a = cylinderStrokes(c1, p.supply);
    const b = cylinderStrokes(c2, p.supply);
    return [
      move(s[0] as number, d.extend1, p.stroke, a.extend.speed, a.retract.speed),
      move(s[1] as number, d.extend2, p.stroke, b.extend.speed, b.retract.speed),
      0,
      0,
      0,
      0,
      r.coils.T1 ? 1 : 0,
    ];
  },

  project(s, p) {
    const x1 = Math.min(p.stroke, Math.max(0, s[0] as number));
    const x2 = Math.min(p.stroke, Math.max(0, s[1] as number));
    const clamped = [x1, x2, ...s.slice(2)];
    const r = evaluate(p, clamped);
    const d = directions(p, r, s[5] as number);
    return [
      x1,
      x2,
      r.relays.K1 ? 1 : 0,
      r.relays.K2 ? 1 : 0,
      r.relays.K3 ? 1 : 0,
      d.extend1 ? 1 : 0,
      r.coils.T1 ? (s[6] as number) : 0,
    ];
  },

  fastestTimeConstant(p) {
    const { c1, c2 } = electroPneumaticCylinders(p);
    const v = Math.max(
      cylinderStrokes(c1, p.supply).extend.speed,
      cylinderStrokes(c1, p.supply).retract.speed,
      cylinderStrokes(c2, p.supply).extend.speed,
      cylinderStrokes(c2, p.supply).retract.speed,
      1e-3,
    );
    return Math.min((0.1 * p.stroke) / v, p.timerDelay / 10);
  },

  outputs(_t, s, p) {
    const r = evaluate(p, s);
    const d = directions(p, r, s[5] as number);
    const { c1, c2 } = electroPneumaticCylinders(p);
    const a = cylinderStrokes(c1, p.supply);
    const b = cylinderStrokes(c2, p.supply);
    const sensors = sensorsOf(p, s[0] as number, s[1] as number);
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.coils)) out[`coil_${k}`] = v ? 1 : 0;
    for (const [k, v] of Object.entries(sensors)) out[`sensor_${k}`] = v ? 1 : 0;
    r.rungsOn.forEach((on, i) => {
      out[`rung${i}`] = on ? 1 : 0;
    });
    let supplyCurrent = 0;
    let s1Current = 0;
    p.ladder.forEach((rung, i) => {
      if (
        !r.rungsOn[i] ||
        (rung.coil === '1M1' && p.fault === '1M1-coil') ||
        (rung.coil === 'K1' && p.fault === 'K1-coil')
      )
        return;
      const iCoil = coilCurrentOf(p, rung.coil);
      supplyCurrent += iCoil;
      if (rung.branches.some((ch) => ch.some((c) => c.source === 'S1' && !c.nc)))
        s1Current += iCoil;
    });
    return {
      ...out,
      x1Mm: mToMm(s[0] as number),
      x2Mm: mToMm(s[1] as number),
      v1: move(s[0] as number, d.extend1, p.stroke, a.extend.speed, a.retract.speed),
      v2: move(s[1] as number, d.extend2, p.stroke, b.extend.speed, b.retract.speed),
      timerElapsed: s[6] as number,
      supplyCurrent,
      s1Current,
      stable: r.stable ? 1 : 0,
      valve1Extend: d.extend1 ? 1 : 0,
      valve2Extend: d.extend2 ? 1 : 0,
    };
  },
};
