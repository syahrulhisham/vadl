/**
 * Instantaneous armature voltage and current of a single-phase converter feeding
 * a DC motor armature (R–L–E load), in periodic steady state over one supply
 * cycle. Milestone 11 extension: the course gives the average-voltage formulas
 * (L-5, L-13). SI units; angles in radians.
 *
 * Formula:  ωL·di/dθ = v(θ) − E − R·i   while a path conducts;
 *           i = 0 and v = E               while no path conducts.
 * Symbols:  vs = Vm·sin θ supply [V]; θ = ωt [rad]; α firing angle [rad];
 *           R [Ω], L [H] armature circuit; E back-emf [V] (negative when the load
 *           drives the motor in reverse); i armature current [A].
 * Assumptions: constant speed (so constant E) over the supply cycle; ideal
 *           switches and instant line commutation; no source inductance; gate
 *           pulses held long enough that a thyristor turns on as soon as it is
 *           gated and forward biased; in circulating-current mode the reactor
 *           drop in the load path is neglected and α2 = π − α1.
 * Source:   standard single-phase converter analysis (e.g. Rashid, Power
 *           Electronics, controlled rectifiers and dual converters).
 * Verification: docs/reference-cases/drive-waveforms.md (RC-M01-06 to -11).
 */

const TWO_PI = 2 * Math.PI;

export type DriveTopology =
  'half-wave' | 'semi' | 'full' | 'dual-noncirculating' | 'dual-circulating';

export const DRIVE_TOPOLOGIES: readonly DriveTopology[] = [
  'half-wave',
  'semi',
  'full',
  'dual-noncirculating',
  'dual-circulating',
];

export interface DriveWaveInput {
  readonly topology: DriveTopology;
  /** Peak supply voltage Vm [V] and supply frequency [Hz]. */
  readonly vm: number;
  readonly frequency: number;
  /** Firing angle α (dual converter: α1 of converter 1) [rad]. */
  readonly alpha: number;
  /** Armature circuit resistance [Ω] (≥ 0) and inductance [H] (> 0). */
  readonly r: number;
  readonly l: number;
  /** Back-emf E [V]. */
  readonly e: number;
  /** Dual converter, non-circulating mode: the converter that is enabled. */
  readonly activeConverter?: 1 | 2;
  /** Dual converter, circulating mode: total reactor inductance Lr [H]. */
  readonly reactor?: number;
}

/** Conduction path at one instant (index into DRIVE_PATHS). */
export type DrivePath =
  | 'none'
  | 'T1'
  | 'freewheel'
  | 'T1+D2'
  | 'T2+D1'
  | 'T1+T2'
  | 'T3+T4'
  | 'C2:T1+T2'
  | 'C2:T3+T4'
  | 'both';

export interface DriveWaveResult {
  /** Supply angle of each sample, 0…2π inclusive [rad]. */
  readonly theta: readonly number[];
  readonly supply: readonly number[];
  /** Armature (load) voltage and current. */
  readonly voltage: readonly number[];
  readonly current: readonly number[];
  /** Circulating current (dual converter, circulating mode; else zeros). */
  readonly circulating: readonly number[];
  readonly path: readonly DrivePath[];
  readonly averageVoltage: number;
  readonly averageCurrent: number;
  readonly rmsCurrent: number;
  readonly minCurrent: number;
  readonly maxCurrent: number;
  /** Mean of v·i over the cycle [W]; negative when power returns to the supply. */
  readonly power: number;
  /** True when the armature current never stays at zero during the cycle. */
  readonly continuous: boolean;
  /** First angle after firing at which the current returns to zero [rad]; NaN if continuous. */
  readonly extinctionAngle: number;
  /** Angle for which a path conducts in each firing period [rad]. */
  readonly conductionAngle: number;
  readonly peakCirculating: number;
  /** False if the periodic steady state was not reached (e.g. R = 0 with a net average voltage). */
  readonly converged: boolean;
}

const mod = (x: number, m: number) => ((x % m) + m) % m;

/** Output voltage of a full converter fired at α, while conducting. */
function fullVoltage(vm: number, alpha: number, theta: number): number {
  const vs = vm * Math.sin(theta);
  return mod(theta - alpha, TWO_PI) < Math.PI ? vs : -vs;
}

/**
 * Voltage a unidirectional converter applies at angle θ while it conducts
 * (the conducting path is set by the firing sequence), and that path.
 */
export function driveConductingVoltage(
  topology: 'half-wave' | 'semi' | 'full',
  vm: number,
  alpha: number,
  theta: number,
): { readonly v: number; readonly path: DrivePath } {
  const t = mod(theta, TWO_PI);
  const vs = vm * Math.sin(t);
  if (topology === 'full') {
    const first = mod(t - alpha, TWO_PI) < Math.PI;
    return { v: first ? vs : -vs, path: first ? 'T1+T2' : 'T3+T4' };
  }
  if (topology === 'semi') {
    if (t >= alpha && t < Math.PI) return { v: vs, path: 'T1+D2' };
    if (t >= Math.PI + alpha) return { v: -vs, path: 'T2+D1' };
    return { v: 0, path: 'freewheel' };
  }
  if (t >= alpha && t < Math.PI) return { v: vs, path: 'T1' };
  return { v: 0, path: 'freewheel' };
}

/** Firing instants in one cycle, with the devices gated at each [rad]. */
export function driveGateAngles(
  topology: DriveTopology,
  alpha: number,
): readonly { readonly device: string; readonly angle: number }[] {
  if (topology === 'half-wave') return [{ device: 'T1', angle: alpha }];
  if (topology === 'semi')
    return [
      { device: 'T1', angle: alpha },
      { device: 'T2', angle: Math.PI + alpha },
    ];
  const one = [
    { device: 'T1, T2', angle: alpha },
    { device: 'T3, T4', angle: Math.PI + alpha },
  ];
  if (topology === 'full') return one;
  const a2 = Math.PI - alpha;
  return [
    { device: 'C1: T1, T2', angle: alpha },
    { device: 'C1: T3, T4', angle: Math.PI + alpha },
    { device: 'C2: T1, T2', angle: a2 },
    { device: 'C2: T3, T4', angle: Math.PI + a2 },
  ];
}

/** Average output voltage in continuous conduction [V] (course formulas). */
export function driveAverageVoltageContinuous(
  topology: DriveTopology,
  vm: number,
  alpha: number,
): number {
  if (topology === 'half-wave') return (vm / TWO_PI) * (1 + Math.cos(alpha));
  if (topology === 'semi') return (vm / Math.PI) * (1 + Math.cos(alpha));
  return ((2 * vm) / Math.PI) * Math.cos(alpha);
}

/**
 * Peak circulating current of a dual converter in circulating-current mode,
 * (2Vm/ωLr)(1 − |cos α1|) [A]. Verification: RC-M01-11.
 */
export function dualCirculatingPeak(
  vm: number,
  frequency: number,
  alpha1: number,
  reactor: number,
): number {
  return ((2 * vm) / (TWO_PI * frequency * reactor)) * (1 - Math.abs(Math.cos(alpha1)));
}

const STEPS = 3600; // integration steps per supply cycle (0.1°)
const OUT = 720; // output samples per supply cycle (0.5°)
const MAX_CYCLES = 400;

interface Cycle {
  readonly v: number[];
  readonly i: number[];
  readonly path: DrivePath[];
  readonly end: number;
  readonly on: boolean;
  /** Means of v and of v·i over the cycle, integrated on the fine grid. */
  readonly vMean: number;
  readonly pMean: number;
}

/** One supply cycle of a unidirectional converter (i ≥ 0), starting from current i0. */
function unidirectionalCycle(
  topology: 'half-wave' | 'semi' | 'full',
  inp: DriveWaveInput,
  i0: number,
  on0: boolean,
): Cycle {
  const wl = TWO_PI * inp.frequency * inp.l;
  const h = TWO_PI / STEPS;
  const v: number[] = [];
  const cur: number[] = [];
  const path: DrivePath[] = [];
  let i = i0;
  let on = on0;
  let vSum = 0;
  let pSum = 0;
  const src = (th: number) => driveConductingVoltage(topology, inp.vm, inp.alpha, th);
  const slope = (th: number, x: number) => (src(th).v - inp.e - inp.r * x) / wl;
  for (let k = 0; k <= STEPS; k += 1) {
    const th = k * h;
    const s = src(th);
    if (!on && s.v > inp.e) on = true;
    if (k % (STEPS / OUT) === 0) {
      v.push(on ? s.v : inp.e);
      cur.push(on ? i : 0);
      path.push(on ? s.path : 'none');
    }
    if (k === STEPS) break;
    if (on) {
      // RK4 over one step; the source is continuous except at firing instants.
      const k1 = slope(th, i);
      const k2 = slope(th + h / 2, i + (h / 2) * k1);
      const k3 = slope(th + h / 2, i + (h / 2) * k2);
      const k4 = slope(th + h - 1e-12, i + h * k3);
      const next = Math.max(0, i + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
      // Simpson's rule for the means, with one-sided values at the step ends.
      const va = s.v;
      const vm = src(th + h / 2).v;
      const vb = src(th + h - 1e-12).v;
      vSum += (h / 6) * (va + 4 * vm + vb);
      pSum += (h / 6) * (va * i + 4 * vm * ((i + next) / 2) + vb * next);
      if (next <= 0) {
        i = 0;
        on = false;
      } else {
        i = next;
      }
    } else {
      vSum += h * inp.e;
    }
  }
  return { v, i: cur, path, end: i, on, vMean: vSum / TWO_PI, pMean: pSum / TWO_PI };
}

/** One supply cycle of the load in circulating-current mode (current of either sign). */
function circulatingCycle(inp: DriveWaveInput, i0: number): Cycle {
  const wl = TWO_PI * inp.frequency * inp.l;
  const h = TWO_PI / STEPS;
  const a2 = Math.PI - inp.alpha;
  const load = (th: number) =>
    (fullVoltage(inp.vm, inp.alpha, th) - fullVoltage(inp.vm, a2, th)) / 2;
  const slope = (th: number, x: number) => (load(th) - inp.e - inp.r * x) / wl;
  const v: number[] = [];
  const cur: number[] = [];
  const path: DrivePath[] = [];
  let i = i0;
  let vSum = 0;
  let pSum = 0;
  for (let k = 0; k <= STEPS; k += 1) {
    const th = k * h;
    if (k % (STEPS / OUT) === 0) {
      v.push(load(th));
      cur.push(i);
      path.push('both');
    }
    if (k === STEPS) break;
    const k1 = slope(th, i);
    const k2 = slope(th + h / 2, i + (h / 2) * k1);
    const k3 = slope(th + h / 2, i + (h / 2) * k2);
    const k4 = slope(th + h - 1e-12, i + h * k3);
    const next = i + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    const va = load(th);
    const vm = load(th + h / 2);
    const vb = load(th + h - 1e-12);
    vSum += (h / 6) * (va + 4 * vm + vb);
    pSum += (h / 6) * (va * i + 4 * vm * ((i + next) / 2) + vb * next);
    i = next;
  }
  return { v, i: cur, path, end: i, on: true, vMean: vSum / TWO_PI, pMean: pSum / TWO_PI };
}

/** Circulating current over one cycle: the reactor integrates v1 + v2 and never goes negative. */
function circulatingCurrent(inp: DriveWaveInput): number[] {
  const wlr = TWO_PI * inp.frequency * (inp.reactor ?? Number.NaN);
  const a2 = Math.PI - inp.alpha;
  const n = OUT * 5;
  const h = TWO_PI / n;
  const vr = (th: number) => fullVoltage(inp.vm, inp.alpha, th) + fullVoltage(inp.vm, a2, th);
  const raw: number[] = [0];
  let acc = 0;
  for (let k = 0; k < n; k += 1) {
    const th = k * h;
    // Simpson's rule on each small step.
    acc += (h / 6) * (vr(th + 1e-12) + 4 * vr(th + h / 2) + vr(th + h - 1e-12));
    raw.push(acc / wlr);
  }
  const min = Math.min(...raw);
  const out: number[] = [];
  for (let k = 0; k <= OUT; k += 1) out.push((raw[k * 5] ?? 0) - min);
  return out;
}

function mean(xs: readonly number[]): number {
  // Trapezoidal mean over one period (first and last samples are the same instant).
  let s = 0;
  for (let k = 0; k < xs.length - 1; k += 1) s += ((xs[k] ?? 0) + (xs[k + 1] ?? 0)) / 2;
  return s / (xs.length - 1);
}

/**
 * Periodic steady-state armature waveforms over one supply cycle.
 * Verification: RC-M01-06 to RC-M01-11.
 */
export function driveWaveforms(inp: DriveWaveInput): DriveWaveResult {
  const theta: number[] = [];
  const supply: number[] = [];
  for (let k = 0; k <= OUT; k += 1) {
    const th = (k * TWO_PI) / OUT;
    theta.push(th);
    supply.push(inp.vm * Math.sin(th));
  }

  const scale = Math.max(1, inp.vm / Math.max(inp.r, TWO_PI * inp.frequency * inp.l));
  let cycle: Cycle;
  let converged = false;
  let sign = 1;

  if (inp.topology === 'dual-circulating') {
    let i0 = 0;
    cycle = circulatingCycle(inp, i0);
    for (let n = 0; n < MAX_CYCLES; n += 1) {
      cycle = circulatingCycle(inp, i0);
      if (Math.abs(cycle.end - i0) < 1e-7 * scale) {
        converged = true;
        break;
      }
      i0 = cycle.end;
    }
  } else {
    // Converter 2 of a dual converter is the mirror image: solve for −i with −E and α2.
    const second = inp.topology === 'dual-noncirculating' && inp.activeConverter === 2;
    sign = second ? -1 : 1;
    const topology = inp.topology === 'dual-noncirculating' ? 'full' : inp.topology;
    const eff: DriveWaveInput = second ? { ...inp, alpha: Math.PI - inp.alpha, e: -inp.e } : inp;
    let i0 = 0;
    let on0 = false;
    cycle = unidirectionalCycle(topology, eff, i0, on0);
    for (let n = 0; n < MAX_CYCLES; n += 1) {
      cycle = unidirectionalCycle(topology, eff, i0, on0);
      if (Math.abs(cycle.end - i0) < 1e-7 * scale && cycle.on === on0) {
        converged = true;
        break;
      }
      i0 = cycle.end;
      on0 = cycle.on;
    }
    if (second) {
      cycle = {
        ...cycle,
        path: cycle.path.map((p) => (p === 'T1+T2' ? 'C2:T1+T2' : p === 'T3+T4' ? 'C2:T3+T4' : p)),
      };
    }
  }

  const voltage = cycle.v.map((x) => sign * x);
  const current = cycle.i.map((x) => sign * x);
  const circulating =
    inp.topology === 'dual-circulating' && inp.reactor
      ? circulatingCurrent(inp)
      : theta.map(() => 0);

  // Conduction statistics from the (unsigned) cycle.
  const offSamples = cycle.path.filter((p) => p === 'none').length;
  const continuous = offSamples === 0;
  const period = inp.topology === 'half-wave' ? TWO_PI : Math.PI;
  let extinction = Number.NaN;
  if (!continuous) {
    const start = mod(sign === -1 ? Math.PI - inp.alpha : inp.alpha, TWO_PI);
    const first = Math.ceil((start / TWO_PI) * OUT);
    let seenOn = false;
    for (let j = 0; j <= OUT; j += 1) {
      const isOn = cycle.path[(first + j) % OUT] !== 'none';
      if (isOn) seenOn = true;
      if (seenOn && !isOn) {
        extinction = ((first + j) * TWO_PI) / OUT;
        break;
      }
    }
  }
  const onFraction = 1 - offSamples / cycle.path.length;
  return {
    theta,
    supply,
    voltage,
    current,
    circulating,
    path: cycle.path,
    averageVoltage: sign * cycle.vMean,
    averageCurrent: mean(current),
    rmsCurrent: Math.sqrt(mean(current.map((x) => x * x))),
    minCurrent: Math.min(...current),
    maxCurrent: Math.max(...current),
    power: cycle.pMean,
    continuous,
    extinctionAngle: extinction,
    conductionAngle: continuous ? period : onFraction * period,
    peakCirculating: Math.max(...circulating),
    converged,
  };
}

/**
 * Operating quadrant from the signs of speed (back-emf E) and torque (average
 * armature current): 1 forward motoring, 2 forward braking, 3 reverse motoring,
 * 4 reverse braking; 0 when either is zero.
 */
export function driveQuadrant(e: number, averageCurrent: number, tolerance = 1e-6): number {
  if (Math.abs(e) < tolerance || Math.abs(averageCurrent) < tolerance) return 0;
  if (e > 0) return averageCurrent > 0 ? 1 : 2;
  return averageCurrent < 0 ? 3 : 4;
}
