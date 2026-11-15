/**
 * RC-M03-01 to RC-M03-04. Literals from docs/reference-cases/power-converters.md
 * (and RC-M01-04 for averages). Each waveform is integrated numerically and the
 * result compared with the hand-calculated closed-form value.
 */
import { describe, expect, it } from 'vitest';
import {
  dcdcConverter,
  degToRad,
  harmonicRms,
  inverterFundamentalRms,
  inverterOutput,
  peakFromRms,
  peakPhaseFromLine,
  rectifierOutput,
  thd,
  waveStats,
  type RectifierKind,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-5) =>
  expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-9)).toBeLessThan(tol);
const abs = (actual: number, expected: number, tol: number) =>
  expect(Math.abs(actual - expected)).toBeLessThan(tol);

const VM = peakFromRms(240);
const TWO_PI = 2 * Math.PI;
const stats = (kind: RectifierKind, alphaDeg: number, vm = VM) =>
  waveStats((th) => rectifierOutput(kind, vm, degToRad(alphaDeg), th), TWO_PI, 20000);

describe('RC-M03-01 Lab 1, resistive load, 240 V', () => {
  it('uncontrolled: half-wave avg 108.038 V rms 169.706 V; bridge avg 216.076 V rms 240 V', () => {
    const h = stats('diode-half', 0);
    abs(h.average, 108.038, 0.01);
    abs(h.rms, 169.706, 0.01);
    const b = stats('diode-bridge', 0);
    abs(b.average, 216.076, 0.01);
    abs(b.rms, 240, 0.01);
  });

  it.each([
    [0, 108.038, 169.706, 216.076, 240],
    [30, 100.801, 167.241, 201.602, 236.515],
    [60, 81.0285, 152.216, 162.057, 215.265],
    [90, 54.019, 120, 108.038, 169.706],
    [120, 27.0095, 75.0362, 54.019, 106.117],
    [150, 7.23718, 28.8172, 14.4743, 40.7537],
  ])(
    'α = %i°: half-wave thyristor avg %f rms %f; full bridge (R) avg %f rms %f',
    (a, hAvg, hRms, fAvg, fRms) => {
      const h = stats('thyristor-half', a);
      abs(h.average, hAvg, 0.02);
      abs(h.rms, hRms, 0.02);
      const f = stats('thyristor-bridge-r', a);
      abs(f.average, fAvg, 0.02);
      abs(f.rms, fRms, 0.02);
    },
  );

  it('at α = 180° nothing conducts', () => {
    expect(stats('thyristor-half', 180).rms).toBe(0);
    expect(stats('thyristor-bridge-r', 180).rms).toBe(0);
  });

  it('form factor 1.11072 and 1.57080; ripple factor 0.48343 and 1.21136; efficiency 8/π² 0.810569 and 4/π² 0.405285', () => {
    const b = stats('diode-bridge', 0);
    const h = stats('diode-half', 0);
    rel(b.rms / b.average, 1.11072, 1e-4);
    rel(h.rms / h.average, 1.5708, 1e-4);
    rel(Math.sqrt((b.rms / b.average) ** 2 - 1), 0.48343, 1e-4);
    rel(Math.sqrt((h.rms / h.average) ** 2 - 1), 1.21136, 1e-4);
    rel(b.average ** 2 / b.rms ** 2, 0.810569, 1e-4);
    rel(h.average ** 2 / h.rms ** 2, 0.405285, 1e-4);
  });

  it('course Exercise 1: 340 V, 240 Ω → Vo 306.108 V, Io 1.27545 A', () => {
    const s = stats('diode-bridge', 0, peakFromRms(340));
    rel(s.average, 306.108, 1e-4);
    rel(s.average / 240, 1.27545, 1e-4);
  });
});

describe('inductive-load converters (continuous current)', () => {
  it('full bridge: (2Vm/π)cos α — 187.127 V at 30°, −108.038 V at 120° (RC-M01-04)', () => {
    abs(stats('thyristor-bridge-l', 30).average, 187.127, 0.02);
    abs(stats('thyristor-bridge-l', 120).average, -108.038, 0.02);
  });

  it('semi bridge: (Vm/π)(1 + cos α) — 162.057 V at 60°', () => {
    abs(stats('semi-bridge-l', 60).average, 162.057, 0.02);
  });

  it('RC-M03-02 three-phase bridge, 400 V line, α 30° → 467.818 V; α 0 → 540.190 V', () => {
    const vm = peakPhaseFromLine(400);
    abs(stats('three-phase-bridge-l', 30, vm).average, 467.818, 0.02);
    abs(stats('three-phase-bridge-l', 0, vm).average, 540.19, 0.02);
  });
});

describe('RC-M03-03 DC-DC converters', () => {
  it('buck 48 V, D 0.4, R 10 Ω: Vo 19.2 V, IL 1.92 A, ΔI 0.576 A, 2.208/1.632 A, Lmin 150 µH, ΔVC 0.036 V', () => {
    const r = dcdcConverter('buck', 48, 0.4, 1e-3, 100e-6, 10, 20e3);
    rel(r.vo, 19.2);
    rel(r.il, 1.92);
    rel(r.ripple, 0.576);
    rel(r.iMax, 2.208);
    rel(r.iMin, 1.632);
    rel(r.lMin, 150e-6);
    rel(r.vRipple, 0.036);
    expect(r.continuous).toBe(true);
  });

  it('boost 12 V, D 0.6, R 20 Ω, C 470 µF: Vo 30 V, IL 3.75 A, ΔI 0.36 A, Lmin 48 µH, ΔVo 0.0957447 V', () => {
    const r = dcdcConverter('boost', 12, 0.6, 1e-3, 470e-6, 20, 20e3);
    rel(r.vo, 30);
    rel(r.il, 3.75);
    rel(r.ripple, 0.36);
    rel(r.lMin, 48e-6);
    rel(r.vRipple, 0.0957447);
  });

  it('buck-boost 24 V, D 0.6, R 20 Ω: Vo −36 V, IL 4.5 A, ΔI 0.72 A, Lmin 80 µH', () => {
    const r = dcdcConverter('buck-boost', 24, 0.6, 1e-3, 470e-6, 20, 20e3);
    rel(r.vo, -36);
    rel(r.il, 4.5);
    rel(r.ripple, 0.72);
    rel(r.lMin, 80e-6);
  });

  it('flags discontinuous conduction when L < Lmin', () => {
    expect(dcdcConverter('buck', 48, 0.4, 100e-6, 100e-6, 10, 20e3).continuous).toBe(false);
  });
});

describe('RC-M03-04 inverters (numerical Fourier against closed form)', () => {
  const run = (kind: Parameters<typeof inverterOutput>[0], vdc: number, ma: number, mf: number) => {
    const f = (th: number) => inverterOutput(kind, vdc, ma, mf, th);
    return {
      rms: waveStats(f, TWO_PI, 40000).rms,
      v1: harmonicRms(f, TWO_PI, 1, 40000),
      thd: thd(f, TWO_PI, 40000),
    };
  };

  it('single-phase square wave 200 V: rms 200 V, fundamental 180.063 V, THD 48.3426 %', () => {
    const r = run('single-square', 200, 1, 21);
    rel(r.rms, 200, 1e-4);
    rel(r.v1, 180.063, 1e-3);
    rel(r.thd, 0.483426, 1e-3);
    rel(inverterFundamentalRms('single-square', 200, 1), 180.063);
  });

  it('single-phase bipolar SPWM ma 0.8, 200 V: fundamental 113.137 V rms (within 1 %)', () => {
    rel(run('single-bipolar', 200, 0.8, 21).v1, 113.137, 0.01);
    rel(run('single-unipolar', 200, 0.8, 21).v1, 113.137, 0.01);
    rel(inverterFundamentalRms('single-bipolar', 200, 0.8), 113.137);
  });

  it('three-phase six-step 600 V: line rms 489.898 V, fundamental 467.818 V, THD 31.0842 %', () => {
    const r = run('three-six-step', 600, 1, 21);
    rel(r.rms, 489.898, 1e-3);
    rel(r.v1, 467.818, 1e-3);
    rel(r.thd, 0.310842, 1e-3);
    rel(inverterFundamentalRms('three-six-step', 600, 1), 467.818);
  });

  it('three-phase SPWM ma 0.8, 600 V: line fundamental 293.939 V rms (within 1 %)', () => {
    rel(run('three-spwm', 600, 0.8, 21).v1, 293.939, 0.01);
    rel(inverterFundamentalRms('three-spwm', 600, 0.8), 293.939);
  });
});
