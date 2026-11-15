/**
 * Converter waveforms from ideal switching functions, and numerical waveform
 * statistics. SI units; angles in radians. Verification:
 * docs/reference-cases/power-converters.md (RC-M03-01 to -04).
 *
 * Assumptions: ideal switches and diodes; no source inductance, overlap or dead
 * time; inductive loads carry ripple-free current; choppers in continuous
 * conduction (checked); inverters feed a resistive load.
 */

const TWO_PI = 2 * Math.PI;

/** Wrap an angle to 0…2π. */
export function wrapAngle(theta: number): number {
  return ((theta % TWO_PI) + TWO_PI) % TWO_PI;
}

// ---------------------------------------------------------------------------
// Rectifiers and phase-controlled converters (supply angle θ = ωt)
// ---------------------------------------------------------------------------

export type RectifierKind =
  | 'diode-half'
  | 'diode-bridge'
  | 'thyristor-half'
  | 'thyristor-bridge-r'
  | 'thyristor-bridge-l'
  | 'semi-bridge-l'
  | 'three-phase-bridge-l';

export const RECTIFIER_KINDS: readonly RectifierKind[] = [
  'diode-half',
  'diode-bridge',
  'thyristor-half',
  'thyristor-bridge-r',
  'thyristor-bridge-l',
  'semi-bridge-l',
  'three-phase-bridge-l',
];

/** True for converters whose firing angle α matters. */
export function isControlled(kind: RectifierKind): boolean {
  return !kind.startsWith('diode');
}

/** True for converters modelled with a highly inductive (ripple-free current) load. */
export function isInductiveLoad(kind: RectifierKind): boolean {
  return kind.endsWith('-l');
}

/**
 * Instantaneous output voltage [V] at supply angle θ.
 * Single-phase: vs = Vm·sin θ. Three-phase: Vm is the peak PHASE voltage; the
 * output follows the line voltages (peak √3·Vm) in 60° segments.
 */
export function rectifierOutput(
  kind: RectifierKind,
  vm: number,
  alpha: number,
  theta: number,
): number {
  const th = wrapAngle(theta);
  const v = vm * Math.sin(th);
  const a = isControlled(kind) ? alpha : 0;
  switch (kind) {
    case 'diode-half':
      return Math.max(v, 0);
    case 'diode-bridge':
      return Math.abs(v);
    case 'thyristor-half':
      return th >= a && th <= Math.PI ? v : 0;
    case 'thyristor-bridge-r':
      return th % Math.PI >= a ? Math.abs(v) : 0;
    case 'thyristor-bridge-l':
      // One thyristor pair conducts from α to α + π, the other from α + π to α + 2π.
      return wrapAngle(th - a) < Math.PI ? v : -v;
    case 'semi-bridge-l':
      // Freewheeling diode holds the output at zero from 0 to α in each half cycle.
      return th % Math.PI >= a ? Math.abs(v) : 0;
    case 'three-phase-bridge-l': {
      const seg = Math.PI / 3;
      const psi = (th % seg) - Math.PI / 6 + a;
      return Math.sqrt(3) * vm * Math.cos(psi);
    }
  }
}

/** Thyristor firing instants within one supply cycle [rad]: α and α + π (1-φ bridge), α + k·π/3 (3-φ). */
export function firingAngles(kind: RectifierKind, alpha: number): number[] {
  if (!isControlled(kind)) return [];
  if (kind === 'thyristor-half') return [alpha];
  if (kind === 'three-phase-bridge-l')
    return Array.from({ length: 6 }, (_, k) => alpha + (k * Math.PI) / 3);
  return [alpha, alpha + Math.PI];
}

/** 1 during a gate pulse of the given width after a firing instant, else 0. */
export function gatePulse(
  kind: RectifierKind,
  alpha: number,
  theta: number,
  width = Math.PI / 18,
): number {
  const th = wrapAngle(theta);
  return firingAngles(kind, alpha).some((f) => {
    const d = wrapAngle(th - f);
    return d < width;
  })
    ? 1
    : 0;
}

// ---------------------------------------------------------------------------
// DC-DC converters, steady state, continuous conduction
// ---------------------------------------------------------------------------

export type DcDcKind = 'buck' | 'boost' | 'buck-boost';
export const DCDC_KINDS: readonly DcDcKind[] = ['buck', 'boost', 'buck-boost'];

export interface DcDcResult {
  /** Average output voltage [V] (negative for buck-boost). */
  readonly vo: number;
  /** Average load current [A]. */
  readonly io: number;
  /** Average inductor current [A]. */
  readonly il: number;
  /** Inductor ripple, peak to peak [A]. */
  readonly ripple: number;
  readonly iMax: number;
  readonly iMin: number;
  /** Minimum inductance for continuous conduction [H]. */
  readonly lMin: number;
  /** Output voltage ripple, peak to peak [V]. */
  readonly vRipple: number;
  /** True when Imin > 0 (continuous conduction): the formulas apply. */
  readonly continuous: boolean;
}

/**
 * Ideal DC-DC converter in continuous conduction (LN Ch1 Part I p35–46):
 *   buck  Vo = D·Vs,          ΔI = Vo(1 − D)/(L·f),  Lmin = (1 − D)R/(2f),   ΔVo = ΔI/(8fC)
 *   boost Vo = Vs/(1 − D),    ΔI = Vs·D/(L·f),       Lmin = D(1 − D)²R/(2f), ΔVo = Vo·D/(RCf)
 *   buck-boost Vo = −Vs·D/(1 − D), ΔI = Vs·D/(L·f),  Lmin = (1 − D)²R/(2f),  ΔVo = |Vo|·D/(RCf)
 */
export function dcdcConverter(
  kind: DcDcKind,
  vs: number,
  d: number,
  l: number,
  c: number,
  r: number,
  f: number,
): DcDcResult {
  let vo: number;
  let il: number;
  let ripple: number;
  let lMin: number;
  let vRipple: number;
  switch (kind) {
    case 'buck':
      vo = d * vs;
      il = vo / r;
      ripple = (vo * (1 - d)) / (l * f);
      lMin = ((1 - d) * r) / (2 * f);
      vRipple = ripple / (8 * f * c);
      break;
    case 'boost':
      vo = vs / (1 - d);
      il = vs / ((1 - d) ** 2 * r);
      ripple = (vs * d) / (l * f);
      lMin = (d * (1 - d) ** 2 * r) / (2 * f);
      vRipple = (vo * d) / (r * c * f);
      break;
    case 'buck-boost':
      vo = (-vs * d) / (1 - d);
      il = (vs * d) / (r * (1 - d) ** 2);
      ripple = (vs * d) / (l * f);
      lMin = ((1 - d) ** 2 * r) / (2 * f);
      vRipple = (Math.abs(vo) * d) / (r * c * f);
      break;
  }
  const iMax = il + ripple / 2;
  const iMin = il - ripple / 2;
  return { vo, io: vo / r, il, ripple, iMax, iMin, lMin, vRipple, continuous: iMin > 0 };
}

/** Inductor current [A] at time τ within the switching period (triangular in steady state). */
export function dcdcInductorCurrent(res: DcDcResult, d: number, f: number, tau: number): number {
  const ts = 1 / f;
  const t = ((tau % ts) + ts) % ts;
  const ton = d * ts;
  return t < ton
    ? res.iMin + (res.ripple * t) / ton
    : res.iMax - (res.ripple * (t - ton)) / (ts - ton);
}

/** Switch gate signal: 1 while on (first D·Ts of each period). */
export function dcdcGate(d: number, f: number, tau: number): number {
  const ts = 1 / f;
  const t = ((tau % ts) + ts) % ts;
  return t < d * ts ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Inverters (output angle θ = 2π·f1·t)
// ---------------------------------------------------------------------------

export type InverterKind =
  'single-square' | 'single-bipolar' | 'single-unipolar' | 'three-six-step' | 'three-spwm';

export const INVERTER_KINDS: readonly InverterKind[] = [
  'single-square',
  'single-bipolar',
  'single-unipolar',
  'three-six-step',
  'three-spwm',
];

/** Triangular carrier between −1 and +1 with `mf` periods per output cycle. */
export function triangleCarrier(theta: number, mf: number): number {
  const x = (wrapAngle(theta) * mf) / TWO_PI; // carrier cycles
  const frac = x - Math.floor(x);
  return frac < 0.5 ? 4 * frac - 1 : 3 - 4 * frac;
}

/** Leg (pole) voltage to the negative DC rail for phase shift `shift` [V]: Vdc or 0. */
function legVoltage(
  kind: InverterKind,
  vdc: number,
  ma: number,
  mf: number,
  theta: number,
  shift: number,
): number {
  const ref = Math.sin(theta - shift);
  if (kind === 'three-six-step') return ref >= 0 ? vdc : 0;
  return ma * ref > triangleCarrier(theta, mf) ? vdc : 0;
}

/**
 * Inverter output voltage [V]: across the load for single-phase, line-to-line
 * vab for three-phase.
 */
export function inverterOutput(
  kind: InverterKind,
  vdc: number,
  ma: number,
  mf: number,
  theta: number,
): number {
  const th = wrapAngle(theta);
  switch (kind) {
    case 'single-square':
      return Math.sin(th) >= 0 ? vdc : -vdc;
    case 'single-bipolar':
      return ma * Math.sin(th) > triangleCarrier(th, mf) ? vdc : -vdc;
    case 'single-unipolar': {
      const c = triangleCarrier(th, mf);
      const va = ma * Math.sin(th) > c ? vdc : 0;
      const vb = -ma * Math.sin(th) > c ? vdc : 0;
      return va - vb;
    }
    case 'three-six-step':
    case 'three-spwm':
      return legVoltage(kind, vdc, ma, mf, th, 0) - legVoltage(kind, vdc, ma, mf, th, TWO_PI / 3);
  }
}

/** Upper switch gate of leg A: 1 when on. */
export function inverterGate(kind: InverterKind, ma: number, mf: number, theta: number): number {
  const th = wrapAngle(theta);
  if (kind === 'single-square' || kind === 'three-six-step') return Math.sin(th) >= 0 ? 1 : 0;
  return ma * Math.sin(th) > triangleCarrier(th, mf) ? 1 : 0;
}

/** Closed-form fundamental (rms) for square-wave and six-step, and linear-region SPWM [V]. */
export function inverterFundamentalRms(kind: InverterKind, vdc: number, ma: number): number {
  switch (kind) {
    case 'single-square':
      return (4 * vdc) / (Math.PI * Math.SQRT2);
    case 'single-bipolar':
    case 'single-unipolar':
      return (ma * vdc) / Math.SQRT2;
    case 'three-six-step':
      return (Math.sqrt(6) / Math.PI) * vdc;
    case 'three-spwm':
      return ((Math.sqrt(3) / 2) * ma * vdc) / Math.SQRT2;
  }
}

// ---------------------------------------------------------------------------
// Numerical waveform statistics over one period
// ---------------------------------------------------------------------------

export interface WaveStats {
  readonly average: number;
  readonly rms: number;
  readonly min: number;
  readonly max: number;
}

/**
 * Sample instants for the midpoint rule over [0, period]. With `breakpoints`
 * (switching instants inside the period) the interval is split there, so no
 * sample cell straddles a jump and each piece is integrated with second-order
 * accuracy. Returns [instant, weight] pairs; the weights sum to 1.
 */
function midpoints(
  period: number,
  n: number,
  breakpoints: readonly number[] = [],
): [number, number][] {
  const cuts = [0, ...breakpoints.map((b) => ((b % period) + period) % period), period]
    .sort((a, b) => a - b)
    .filter((v, i, arr) => i === 0 || v - (arr[i - 1] as number) > period * 1e-12);
  const out: [number, number][] = [];
  for (let k = 1; k < cuts.length; k += 1) {
    const a = cuts[k - 1] as number;
    const b = cuts[k] as number;
    const m = Math.max(1, Math.round((n * (b - a)) / period));
    const h = (b - a) / m;
    for (let i = 0; i < m; i += 1) out.push([a + (i + 0.5) * h, h / period]);
  }
  return out;
}

/** Average, rms, min and max of f over one period by the (piecewise) midpoint rule. */
export function waveStats(
  f: (t: number) => number,
  period: number,
  n = 4000,
  breakpoints: readonly number[] = [],
): WaveStats {
  let sum = 0;
  let sumSq = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const [t, w] of midpoints(period, n, breakpoints)) {
    const v = f(t);
    sum += w * v;
    sumSq += w * v * v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { average: sum, rms: Math.sqrt(sumSq), min, max };
}

/** Switching instants (angles in 0…2π) of a rectifier: zero crossings, firing angles and three-phase segment edges. */
export function rectifierBreakpoints(kind: RectifierKind, alpha: number): number[] {
  const edges =
    kind === 'three-phase-bridge-l'
      ? Array.from({ length: 6 }, (_, k) => (k * Math.PI) / 3)
      : [0, Math.PI];
  return [...edges, ...firingAngles(kind, alpha)];
}

/** RMS of the h-th harmonic of f over one period, by Fourier integration (midpoint rule). */
export function harmonicRms(f: (t: number) => number, period: number, h: number, n = 4000): number {
  let a = 0;
  let b = 0;
  for (let i = 0; i < n; i += 1) {
    const t = ((i + 0.5) * period) / n;
    const v = f(t);
    const w = (TWO_PI * h * t) / period;
    a += v * Math.cos(w);
    b += v * Math.sin(w);
  }
  a = (2 * a) / n;
  b = (2 * b) / n;
  return Math.hypot(a, b) / Math.SQRT2;
}

/** Total harmonic distortion THD = √(Vrms² − V0² − V1²)/V1 (all from numerical integration). */
export function thd(f: (t: number) => number, period: number, n = 4000): number {
  const s = waveStats(f, period, n);
  const v1 = harmonicRms(f, period, 1, n);
  const rest = s.rms * s.rms - s.average * s.average - v1 * v1;
  return Math.sqrt(Math.max(rest, 0)) / v1;
}
