/**
 * RC-M01-04: average converter output. Literals from
 * docs/reference-cases/dc-converter-voltages.md.
 */
import { describe, expect, it } from 'vitest';
import {
  converterAverageVoltage,
  converterPeak,
  degToRad,
  dualConverter2Voltage,
  peakFromRms,
  peakPhaseFromLine,
} from '@/sim-core';

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThan(1e-3);

describe('RC-M01-04 converter averages', () => {
  it('peak values: 240 V rms → 339.411 V; 400 V line → 326.599 V peak phase', () => {
    close(peakFromRms(240), 339.411);
    close(peakPhaseFromLine(400), 326.599);
    close(converterPeak('single-full', 240), 339.411);
    close(converterPeak('three-full', 400), 326.599);
  });

  const vm = 339.411255;
  it.each([
    [0, 108.038, 216.076, 216.076],
    [30, 100.801, 201.602, 187.127],
    [60, 81.0285, 162.057, 108.038],
    [90, 54.019, 108.038, 0],
    [120, 27.0095, 54.019, -108.038],
    [150, 7.23718, 14.4743, -187.127],
    [180, 0, 0, -216.076],
  ])('1-φ 240 V at α = %i°: half %f, semi %f, full %f', (a, half, semi, full) => {
    const alpha = degToRad(a);
    close(converterAverageVoltage('single-half', vm, alpha), half);
    close(converterAverageVoltage('single-semi', vm, alpha), semi);
    close(converterAverageVoltage('single-full', vm, alpha), full);
  });

  it('uncontrolled rectifiers (α = 0) at 120 V and 220 V', () => {
    close(converterAverageVoltage('single-half', peakFromRms(120), 0), 54.019);
    close(converterAverageVoltage('single-half', peakFromRms(220), 0), 99.0348);
    close(converterAverageVoltage('single-full', peakFromRms(120), 0), 108.038);
    close(converterAverageVoltage('single-full', peakFromRms(220), 0), 198.07);
  });

  it('dual converter: α1 = 30° and α2 = 150° give the same +187.127 V', () => {
    close(converterAverageVoltage('single-dual', vm, degToRad(30)), 187.127);
    close(dualConverter2Voltage('single-dual', vm, degToRad(150)), 187.127);
  });

  it('three-phase, 400 V line: full 540.190 V (α 0), 381.972 V (α 45°); half 270.095 V; semi 405.142 V (α 60°)', () => {
    const v = 326.598632;
    close(converterAverageVoltage('three-full', v, 0), 540.19);
    close(converterAverageVoltage('three-full', v, degToRad(45)), 381.972);
    close(converterAverageVoltage('three-half', v, 0), 270.095);
    close(converterAverageVoltage('three-semi', v, degToRad(60)), 405.142);
    close(converterAverageVoltage('three-dual', v, 0), 540.19);
    close(dualConverter2Voltage('three-dual', v, Math.PI), 540.19);
  });
});
