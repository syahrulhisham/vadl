/**
 * RC-M01-06 to RC-M01-11 (Milestone 11). Literals from
 * docs/reference-cases/drive-waveforms.md.
 */
import { describe, expect, it } from 'vitest';
import {
  degToRad,
  driveAverageVoltageContinuous,
  driveGateAngles,
  driveQuadrant,
  driveWaveforms,
  dualCirculatingPeak,
  radToDeg,
  type DriveWaveInput,
} from '@/sim-core';

const VM = 339.411;
const base = { vm: VM, frequency: 50 } as const;
const rel = (actual: number, expected: number, tol: number) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);
const at = (r: ReturnType<typeof driveWaveforms>, deg: number) => {
  const k = Math.round((deg / 360) * (r.theta.length - 1));
  return { v: r.voltage[k] as number, i: r.current[k] as number, path: r.path[k] };
};

describe('RC-M01-06 full converter, continuous conduction', () => {
  const inp: DriveWaveInput = {
    ...base,
    topology: 'full',
    alpha: degToRad(30),
    r: 2,
    l: 0.05,
    e: 150,
  };
  const r = driveWaveforms(inp);
  it('average voltage 187.128 V and average current 18.564 A', () => {
    expect(r.converged).toBe(true);
    rel(r.averageVoltage, 187.128, 2e-3);
    rel(r.averageCurrent, 18.564, 5e-3);
    rel(driveAverageVoltageContinuous('full', VM, degToRad(30)), 187.128, 1e-5);
  });
  it('continuous: 11.437 A at the firing instant, T1 and T2 conducting after it', () => {
    expect(r.continuous).toBe(true);
    expect(Number.isNaN(r.extinctionAngle)).toBe(true);
    rel(at(r, 30).i, 11.437, 1e-2);
    expect(r.minCurrent).toBeGreaterThan(0);
    expect(at(r, 90).path).toBe('T1+T2');
    expect(at(r, 270).path).toBe('T3+T4');
    rel(radToDeg(r.conductionAngle), 180, 1e-9);
  });
  it('the current repeats every half cycle', () => {
    expect(Math.abs(at(r, 100).i - at(r, 280).i)).toBeLessThan(0.02);
  });
});

describe('RC-M01-07 full converter, discontinuous conduction (R = 0)', () => {
  const r = driveWaveforms({
    ...base,
    topology: 'full',
    alpha: degToRad(60),
    r: 0,
    l: 0.005,
    e: VM / 2,
  });
  it('extinction at about 213.2°, conduction for about 153.2°', () => {
    expect(r.continuous).toBe(false);
    // ±0.3° hand tolerance plus one 0.5° output sample.
    expect(Math.abs(radToDeg(r.extinctionAngle) - 213.2)).toBeLessThan(0.8);
    expect(Math.abs(radToDeg(r.conductionAngle) - 153.2)).toBeLessThan(1);
  });
  it('peak 125.46 A at 150°, average 66.24 A', () => {
    rel(at(r, 150).i, 125.46, 1e-2);
    rel(r.maxCurrent, 125.46, 1e-2);
    rel(r.averageCurrent, 66.24, 1e-2);
  });
  it('no path conducts between extinction and the next firing: v = E, i = 0', () => {
    const gap = at(r, 230);
    expect(gap.path).toBe('none');
    expect(gap.i).toBe(0);
    rel(gap.v, VM / 2, 1e-9);
  });
});

describe('RC-M01-08 semi-converter, continuous conduction', () => {
  const r = driveWaveforms({
    ...base,
    topology: 'semi',
    alpha: degToRad(60),
    r: 2,
    l: 0.05,
    e: 120,
  });
  it('average voltage 162.057 V, average current 21.029 A', () => {
    rel(r.averageVoltage, 162.057, 2e-3);
    rel(r.averageCurrent, 21.029, 5e-3);
    expect(r.continuous).toBe(true);
  });
  it('freewheels with zero voltage from 180° to 240°', () => {
    expect(at(r, 200)).toMatchObject({ v: 0, path: 'freewheel' });
    expect(at(r, 100).path).toBe('T1+D2');
    expect(at(r, 300).path).toBe('T2+D1');
  });
});

describe('RC-M01-09 half-wave converter with freewheeling diode', () => {
  const r = driveWaveforms({
    ...base,
    topology: 'half-wave',
    alpha: degToRad(60),
    r: 2,
    l: 0.1,
    e: 40,
  });
  it('average voltage 81.028 V, average current 20.514 A', () => {
    rel(r.averageVoltage, 81.028, 2e-3);
    rel(r.averageCurrent, 20.514, 5e-3);
    expect(r.continuous).toBe(true);
    expect(at(r, 300).path).toBe('freewheel');
  });
});

describe('RC-M01-10 full converter inverting with an overhauling load', () => {
  const r = driveWaveforms({
    ...base,
    topology: 'full',
    alpha: degToRad(150),
    r: 2,
    l: 0.05,
    e: -220,
  });
  it('average voltage −187.128 V, average current +16.436 A', () => {
    rel(r.averageVoltage, -187.128, 2e-3);
    rel(r.averageCurrent, 16.436, 5e-3);
  });
  it('power returns to the supply (about −3076 W): quadrant IV', () => {
    expect(r.power).toBeLessThan(0);
    rel(r.power, -3076, 5e-2);
    expect(driveQuadrant(-220, r.averageCurrent)).toBe(4);
  });
});

describe('RC-M01-11 dual converter', () => {
  const circ: DriveWaveInput = {
    ...base,
    topology: 'dual-circulating',
    alpha: degToRad(60),
    r: 2,
    l: 0.05,
    e: 150,
    reactor: 0.05,
  };
  const r = driveWaveforms(circ);
  it('circulating current peaks at 21.608 A at θ = 180° and is never negative', () => {
    rel(dualCirculatingPeak(VM, 50, degToRad(60), 0.05), 21.608, 1e-4);
    rel(r.peakCirculating, 21.608, 5e-3);
    const k = r.circulating.indexOf(Math.max(...r.circulating));
    expect(Math.abs(radToDeg(r.theta[k] as number) % 180)).toBeLessThan(1);
    expect(Math.min(...r.circulating)).toBeGreaterThanOrEqual(0);
  });
  it('load: 108.038 V average; the current reverses to −20.981 A without dead time', () => {
    rel(r.averageVoltage, 108.038, 2e-3);
    rel(r.averageCurrent, -20.981, 5e-3);
    expect(r.continuous).toBe(true);
    expect(driveQuadrant(150, r.averageCurrent)).toBe(2);
  });
  it('non-circulating: converter 1 cannot carry the reverse current; converter 2 can', () => {
    // Converter 1 still passes positive pulses whenever vs exceeds E; it cannot go negative.
    const one = driveWaveforms({ ...circ, topology: 'dual-noncirculating', activeConverter: 1 });
    expect(one.minCurrent).toBeGreaterThanOrEqual(0);
    expect(one.continuous).toBe(false);
    const two = driveWaveforms({ ...circ, topology: 'dual-noncirculating', activeConverter: 2 });
    expect(two.maxCurrent).toBeLessThanOrEqual(0);
    rel(two.averageCurrent, -20.981, 5e-3);
    rel(two.averageVoltage, 108.038, 2e-3);
    expect(at(two, 200).path?.startsWith('C2:')).toBe(true);
  });
});

describe('gate angles and quadrants', () => {
  it('firing instants per topology', () => {
    expect(driveGateAngles('half-wave', 1)).toHaveLength(1);
    expect(driveGateAngles('semi', 1).map((g) => g.angle)).toEqual([1, Math.PI + 1]);
    expect(driveGateAngles('dual-circulating', 1)).toHaveLength(4);
  });
  it('quadrants from the signs of speed and torque', () => {
    expect(driveQuadrant(100, 10)).toBe(1);
    expect(driveQuadrant(100, -10)).toBe(2);
    expect(driveQuadrant(-100, -10)).toBe(3);
    expect(driveQuadrant(-100, 10)).toBe(4);
    expect(driveQuadrant(0, 10)).toBe(0);
  });
});
