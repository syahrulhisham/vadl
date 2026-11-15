/**
 * Power converter laboratory model (M03). Documentation:
 * docs/simulation-models/m03-power-converters.md.
 *
 * The state is simulation time only (dt/dt = 1). Instantaneous values come from
 * the ideal switching functions in equations/waveforms.ts evaluated at t, so the
 * engine shows the converter like an oscilloscope: Start energises it, Pause
 * freezes the trace. Period statistics (average, rms, fundamental, THD) are
 * computed by numerical integration over one period and cached per parameter set.
 */
import { converterPeak } from '../equations/converters';
import {
  dcdcConverter,
  dcdcGate,
  dcdcInductorCurrent,
  gatePulse,
  harmonicRms,
  inverterFundamentalRms,
  inverterGate,
  inverterOutput,
  isInductiveLoad,
  rectifierBreakpoints,
  rectifierOutput,
  thd,
  triangleCarrier,
  waveStats,
  type DcDcKind,
  type DcDcResult,
  type InverterKind,
  type RectifierKind,
} from '../equations/waveforms';
import type { Issue, SimModel } from '../types';

export type ConverterFamily = 'rectifier' | 'dcdc' | 'inverter';

export interface PowerConverterParams {
  readonly family: ConverterFamily;
  // Rectifiers and phase-controlled converters
  readonly rectifier: RectifierKind;
  /** Supply rms voltage [V]: phase voltage for single-phase, line voltage for three-phase. */
  readonly supplyRms: number;
  readonly supplyFrequency: number;
  /** Firing angle α [rad]. */
  readonly alpha: number;
  readonly loadResistance: number;
  // DC-DC
  readonly dcdc: DcDcKind;
  readonly dcInput: number;
  readonly duty: number;
  readonly inductance: number;
  readonly capacitance: number;
  readonly dcLoadResistance: number;
  readonly switchingFrequency: number;
  // Inverters
  readonly inverter: InverterKind;
  readonly dcLink: number;
  readonly modulationIndex: number;
  /** Frequency ratio mf = carrier/output (integer). */
  readonly frequencyRatio: number;
  readonly outputFrequency: number;
  readonly inverterLoadResistance: number;
}

export interface PowerConverterOutputs extends Readonly<Record<string, number>> {
  /** Instantaneous values. Values not defined for the selected circuit are NaN (shown as "—"). */
  readonly vSupply: number;
  readonly vOut: number;
  readonly iOut: number;
  readonly iSupply: number;
  readonly gate: number;
  readonly carrier: number;
  readonly reference: number;
  readonly iInductor: number;
  // Period statistics
  readonly vAverage: number;
  readonly vRms: number;
  readonly iAverage: number;
  readonly iRms: number;
  readonly formFactor: number;
  readonly rippleFactor: number;
  readonly rectificationEfficiency: number;
  readonly inputPowerFactor: number;
  readonly outputPower: number;
  readonly vFundamental: number;
  readonly vFundamentalClosedForm: number;
  readonly thd: number;
  readonly inductorAverage: number;
  readonly inductorRipple: number;
  readonly inductorMax: number;
  readonly inductorMin: number;
  readonly inductorMinimum: number;
  readonly outputRipple: number;
  readonly continuous: number;
  readonly period: number;
}

export const PC_LIMITS = {
  supplyRms: { min: 10, max: 500 },
  supplyFrequency: { min: 40, max: 70 },
  alpha: { min: 0, max: Math.PI },
  loadResistance: { min: 1, max: 1000 },
  dcInput: { min: 1, max: 600 },
  duty: { min: 0.05, max: 0.95 },
  inductance: { min: 1e-6, max: 0.1 },
  capacitance: { min: 1e-6, max: 0.01 },
  dcLoadResistance: { min: 0.5, max: 1000 },
  switchingFrequency: { min: 1000, max: 100_000 },
  dcLink: { min: 10, max: 1000 },
  modulationIndex: { min: 0.05, max: 1 },
  frequencyRatio: { min: 3, max: 45 },
  outputFrequency: { min: 1, max: 100 },
  inverterLoadResistance: { min: 1, max: 1000 },
} as const;

const DEG = Math.PI / 180;

export const PC_DEFAULTS: PowerConverterParams = {
  family: 'rectifier',
  rectifier: 'thyristor-half',
  supplyRms: 240,
  supplyFrequency: 50,
  alpha: 30 * DEG,
  loadResistance: 100,
  dcdc: 'buck',
  dcInput: 48,
  duty: 0.4,
  inductance: 1e-3,
  capacitance: 100e-6,
  dcLoadResistance: 10,
  switchingFrequency: 20_000,
  inverter: 'single-bipolar',
  dcLink: 200,
  modulationIndex: 0.8,
  frequencyRatio: 21,
  outputFrequency: 50,
  inverterLoadResistance: 50,
};

const TWO_PI = 2 * Math.PI;

/** Duration of one display period [s]: supply cycle, switching period or output cycle. */
export function converterPeriod(p: PowerConverterParams): number {
  if (p.family === 'rectifier') return 1 / p.supplyFrequency;
  if (p.family === 'dcdc') return 1 / p.switchingFrequency;
  return 1 / p.outputFrequency;
}

/** Steady-state DC-DC operating point. */
export function dcdcOf(p: PowerConverterParams): DcDcResult {
  return dcdcConverter(
    p.dcdc,
    p.dcInput,
    p.duty,
    p.inductance,
    p.capacitance,
    p.dcLoadResistance,
    p.switchingFrequency,
  );
}

function rectPeak(p: PowerConverterParams) {
  return converterPeak(
    p.rectifier === 'three-phase-bridge-l' ? 'three-full' : 'single-full',
    p.supplyRms,
  );
}

/** Load current of a rectifier at angle θ: v/R for a resistive load, ripple-free Io = max(Vavg/R, 0) for an inductive load. */
function rectifierCurrent(p: PowerConverterParams, theta: number, vAvg: number): number {
  if (isInductiveLoad(p.rectifier)) return Math.max(vAvg / p.loadResistance, 0);
  return rectifierOutput(p.rectifier, rectPeak(p), p.alpha, theta) / p.loadResistance;
}

/** Single-phase supply current [A]; NaN for the three-phase bridge (not modelled per phase). */
function rectifierSupplyCurrent(p: PowerConverterParams, theta: number, vAvg: number): number {
  const k = p.rectifier;
  if (k === 'three-phase-bridge-l') return Number.NaN;
  const vm = rectPeak(p);
  const th = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  const io = rectifierCurrent(p, th, vAvg);
  const vo = rectifierOutput(k, vm, p.alpha, th);
  switch (k) {
    case 'diode-half':
    case 'thyristor-half':
      return vo !== 0 ? io : 0;
    case 'diode-bridge':
    case 'thyristor-bridge-r':
      return vo !== 0 ? io * Math.sign(Math.sin(th)) : 0;
    case 'thyristor-bridge-l': {
      const d = (((th - p.alpha) % TWO_PI) + TWO_PI) % TWO_PI;
      return d < Math.PI ? io : -io;
    }
    case 'semi-bridge-l':
      return vo !== 0 ? io * Math.sign(Math.sin(th)) : 0;
  }
}

interface PeriodStats {
  readonly vAverage: number;
  readonly vRms: number;
  readonly iAverage: number;
  readonly iRms: number;
  readonly inputPowerFactor: number;
  readonly outputPower: number;
  readonly vFundamental: number;
  readonly vFundamentalClosedForm: number;
  readonly thd: number;
}

const statsCache = new WeakMap<PowerConverterParams, PeriodStats>();
/**
 * Samples per period. Rectifier integrals are split at the switching instants
 * (rectifierBreakpoints), so the midpoint rule is second-order accurate and
 * 4000 samples give averages to better than 1e−5 relative.
 */
const N = 4000;
const N_DCDC = 4000;

/** Period statistics of the selected circuit (numerical integration, cached). */
export function converterStats(p: PowerConverterParams): PeriodStats {
  const cached = statsCache.get(p);
  if (cached) return cached;
  let s: PeriodStats;
  if (p.family === 'rectifier') {
    const vm = rectPeak(p);
    const bp = rectifierBreakpoints(p.rectifier, p.alpha);
    const vf = (th: number) => rectifierOutput(p.rectifier, vm, p.alpha, th);
    const v = waveStats(vf, TWO_PI, N, bp);
    const i = waveStats((th) => rectifierCurrent(p, th, v.average), TWO_PI, N, bp);
    let pf = Number.NaN;
    if (p.rectifier !== 'three-phase-bridge-l') {
      const vsRms = vm / Math.SQRT2;
      const isStats = waveStats((th) => rectifierSupplyCurrent(p, th, v.average), TWO_PI, N, bp);
      const pIn = waveStats(
        (th) => vm * Math.sin(th) * rectifierSupplyCurrent(p, th, v.average),
        TWO_PI,
        N,
        bp,
      ).average;
      pf = isStats.rms > 0 ? pIn / (vsRms * isStats.rms) : Number.NaN;
    }
    s = {
      vAverage: v.average,
      vRms: v.rms,
      iAverage: i.average,
      iRms: i.rms,
      inputPowerFactor: pf,
      outputPower: waveStats((th) => vf(th) * rectifierCurrent(p, th, v.average), TWO_PI, N, bp)
        .average,
      vFundamental: Number.NaN,
      vFundamentalClosedForm: Number.NaN,
      thd: Number.NaN,
    };
  } else if (p.family === 'dcdc') {
    const r = dcdcOf(p);
    const il = waveStats(
      (t) => dcdcInductorCurrent(r, p.duty, p.switchingFrequency, t),
      1 / p.switchingFrequency,
      N_DCDC,
    );
    s = {
      vAverage: r.vo,
      vRms: Math.abs(r.vo),
      iAverage: r.io,
      iRms: il.rms,
      inputPowerFactor: Number.NaN,
      outputPower: (r.vo * r.vo) / p.dcLoadResistance,
      vFundamental: Number.NaN,
      vFundamentalClosedForm: Number.NaN,
      thd: Number.NaN,
    };
  } else {
    const mf = Math.round(p.frequencyRatio);
    const vf = (th: number) => inverterOutput(p.inverter, p.dcLink, p.modulationIndex, mf, th);
    const v = waveStats(vf, TWO_PI, 10 * N);
    s = {
      vAverage: v.average,
      vRms: v.rms,
      iAverage: v.average / p.inverterLoadResistance,
      iRms: v.rms / p.inverterLoadResistance,
      inputPowerFactor: Number.NaN,
      outputPower: (v.rms * v.rms) / p.inverterLoadResistance,
      vFundamental: harmonicRms(vf, TWO_PI, 1, 10 * N),
      vFundamentalClosedForm: inverterFundamentalRms(p.inverter, p.dcLink, p.modulationIndex),
      thd: thd(vf, TWO_PI, 10 * N),
    };
  }
  statsCache.set(p, s);
  return s;
}

/** Steady-state average output against the control variable (characteristic curve). */
export function converterCharacteristic(p: PowerConverterParams, x: number): number {
  if (p.family === 'rectifier') return converterStats({ ...p, alpha: x }).vAverage;
  if (p.family === 'dcdc')
    return dcdcConverter(
      p.dcdc,
      p.dcInput,
      x,
      p.inductance,
      p.capacitance,
      p.dcLoadResistance,
      p.switchingFrequency,
    ).vo;
  return inverterFundamentalRms(p.inverter, p.dcLink, x);
}

function range(
  issues: Issue[],
  key: keyof typeof PC_LIMITS,
  value: number,
  label: string,
  unit: string,
  scale = 1,
) {
  const lim = PC_LIMITS[key];
  if (!Number.isFinite(value) || value < lim.min || value > lim.max) {
    const lo = Math.round(lim.min * scale * 1e6) / 1e6;
    const hi = Math.round(lim.max * scale * 1e6) / 1e6;
    issues.push({
      parameter: key,
      severity: 'error',
      message: `${label} must be between ${lo} and ${hi} ${unit}.`,
    });
  }
}

export const powerConverterModel: SimModel<PowerConverterParams, PowerConverterOutputs> = {
  id: 'm03.power-converter',
  modelClass: 'dynamic',
  defaults: PC_DEFAULTS,
  stateLabels: ['t [s]'],
  assumptions: [
    'Ideal switches and diodes: no voltage drop, no switching or conduction losses, no dead time.',
    'No supply (source) inductance, so commutation is instantaneous (no overlap).',
    'Inductive-load converters carry ripple-free, continuous load current Io = Vavg/R. With a passive load an average below zero cannot be sustained; a DC motor back-emf would be needed.',
    'Resistive loads are pure resistors; the supply is an ideal sinusoid.',
    'DC-DC converters are shown in steady state and continuous conduction; the inductor current is triangular. The output voltage is drawn without its small ripple, which is given as a value.',
    'Inverters feed a resistive load; the carrier is synchronous with an integer frequency ratio mf.',
    'Simplified educational model: it is not a substitute for circuit simulation tools such as PSIM.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    if (p.family === 'rectifier') {
      range(issues, 'supplyRms', p.supplyRms, 'Supply voltage', 'V');
      range(issues, 'supplyFrequency', p.supplyFrequency, 'Supply frequency', 'Hz');
      range(issues, 'alpha', p.alpha, 'Firing angle', '°', 180 / Math.PI);
      range(issues, 'loadResistance', p.loadResistance, 'Load resistance', 'Ω');
    } else if (p.family === 'dcdc') {
      range(issues, 'dcInput', p.dcInput, 'Input voltage', 'V');
      range(issues, 'duty', p.duty, 'Duty cycle', '');
      range(issues, 'inductance', p.inductance, 'Inductance', 'H');
      range(issues, 'capacitance', p.capacitance, 'Capacitance', 'F');
      range(issues, 'dcLoadResistance', p.dcLoadResistance, 'Load resistance', 'Ω');
      range(issues, 'switchingFrequency', p.switchingFrequency, 'Switching frequency', 'Hz');
      if (issues.length === 0 && !dcdcOf(p).continuous) {
        issues.push({
          parameter: 'inductance',
          severity: 'warning',
          message: `Discontinuous conduction: L is below Lmin = ${Number((dcdcOf(p).lMin * 1e6).toPrecision(3))} µH. The continuous-conduction formulas and waveforms shown no longer apply.`,
        });
      }
    } else {
      range(issues, 'dcLink', p.dcLink, 'DC-link voltage', 'V');
      range(issues, 'modulationIndex', p.modulationIndex, 'Modulation index ma', '');
      range(issues, 'frequencyRatio', p.frequencyRatio, 'Frequency ratio mf', '');
      if (!Number.isInteger(p.frequencyRatio)) {
        issues.push({
          parameter: 'frequencyRatio',
          severity: 'error',
          message: 'The frequency ratio mf must be a whole number (synchronous PWM).',
        });
      }
      range(issues, 'outputFrequency', p.outputFrequency, 'Output frequency', 'Hz');
      range(issues, 'inverterLoadResistance', p.inverterLoadResistance, 'Load resistance', 'Ω');
    }
    return issues;
  },

  init() {
    return [0];
  },

  derivatives() {
    return [1];
  },

  outputs(t, _s, p) {
    const st = converterStats(p);
    const nan = Number.NaN;
    let inst: Pick<
      PowerConverterOutputs,
      'vSupply' | 'vOut' | 'iOut' | 'iSupply' | 'gate' | 'carrier' | 'reference' | 'iInductor'
    >;
    let dc: DcDcResult | null = null;
    if (p.family === 'rectifier') {
      const th = TWO_PI * p.supplyFrequency * t;
      const vm = rectPeak(p);
      inst = {
        vSupply: vm * Math.sin(th),
        vOut: rectifierOutput(p.rectifier, vm, p.alpha, th),
        iOut: rectifierCurrent(p, th, st.vAverage),
        iSupply: rectifierSupplyCurrent(p, th, st.vAverage),
        gate: gatePulse(p.rectifier, p.alpha, th),
        carrier: nan,
        reference: nan,
        iInductor: nan,
      };
    } else if (p.family === 'dcdc') {
      dc = dcdcOf(p);
      const g = dcdcGate(p.duty, p.switchingFrequency, t);
      inst = {
        vSupply: p.dcInput,
        vOut: dc.vo,
        iOut: dc.io,
        iSupply:
          p.dcdc === 'boost'
            ? dcdcInductorCurrent(dc, p.duty, p.switchingFrequency, t)
            : g
              ? dcdcInductorCurrent(dc, p.duty, p.switchingFrequency, t)
              : 0,
        gate: g,
        carrier: nan,
        reference: nan,
        iInductor: dcdcInductorCurrent(dc, p.duty, p.switchingFrequency, t),
      };
    } else {
      const th = TWO_PI * p.outputFrequency * t;
      const mf = Math.round(p.frequencyRatio);
      const vo = inverterOutput(p.inverter, p.dcLink, p.modulationIndex, mf, th);
      const pwm = p.inverter !== 'single-square' && p.inverter !== 'three-six-step';
      inst = {
        vSupply: p.dcLink,
        vOut: vo,
        iOut: vo / p.inverterLoadResistance,
        iSupply: nan,
        gate: inverterGate(p.inverter, p.modulationIndex, mf, th),
        carrier: pwm ? triangleCarrier(th, mf) : nan,
        reference: pwm ? p.modulationIndex * Math.sin(th) : nan,
        iInductor: nan,
      };
    }
    const ff = st.vRms / st.vAverage;
    return {
      ...inst,
      ...st,
      formFactor: p.family === 'rectifier' ? ff : nan,
      rippleFactor: p.family === 'rectifier' && Math.abs(ff) >= 1 ? Math.sqrt(ff * ff - 1) : nan,
      rectificationEfficiency:
        p.family === 'rectifier' && st.vRms > 0 && st.iRms > 0
          ? (st.vAverage * st.iAverage) / (st.vRms * st.iRms)
          : nan,
      inductorAverage: dc ? dc.il : nan,
      inductorRipple: dc ? dc.ripple : nan,
      inductorMax: dc ? dc.iMax : nan,
      inductorMin: dc ? dc.iMin : nan,
      inductorMinimum: dc ? dc.lMin : nan,
      outputRipple: dc ? dc.vRipple : nan,
      continuous: dc ? (dc.continuous ? 1 : 0) : nan,
      period: converterPeriod(p),
    };
  },

  fastestTimeConstant(p) {
    // For waveform models the "time constant" is the resolution needed: the step
    // is one tenth of this, giving 1000 steps per supply cycle, 100 per switching
    // period, or 100 per carrier period.
    const period = converterPeriod(p);
    if (p.family === 'rectifier') return period / 100;
    if (p.family === 'dcdc') return period / 10;
    return period / (10 * Math.max(1, Math.round(p.frequencyRatio)));
  },
};

/**
 * One period of every output, sampled at n evenly spaced instants from t = 0.
 * Used for the static waveform plots; the values are the model's own outputs.
 */
export function converterPeriodTrace(
  p: PowerConverterParams,
  n = 400,
): { t: number; values: PowerConverterOutputs }[] {
  const period = converterPeriod(p);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (period * i) / n;
    return { t, values: powerConverterModel.outputs(t, [t], p) };
  });
}
