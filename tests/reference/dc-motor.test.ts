/**
 * DC motor reference cases RC-M01-01, -02, -03, -05 (equation level).
 * Literals copied from docs/reference-cases/dc-motor-steady-state.md,
 * dc-drive-converter.md and dc-motor-other.md.
 */
import { describe, expect, it } from 'vitest';
import {
  backEmf,
  converterAverageVoltage,
  degToRad,
  developedTorque,
  fieldCurrent,
  loadTorque,
  machineConstant,
  peakFromRms,
  radPerSecToRpm,
  rpmToRadPerSec,
  seriesBackEmf,
  seriesTorque,
  speedFromEmfRatio,
  startingCurrent,
  startingResistance,
  steadyStateSeparate,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-5) =>
  expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-12)).toBeLessThan(tol);

describe('RC-M01-01 separately excited, steady state', () => {
  it('Va 220 V, Ra 0.5 Ω, Kv·If 1.2, TL 24 N·m, B 0 → Ia 20 A, Eg 210 V, ω 175 rad/s', () => {
    const { ia, omega } = steadyStateSeparate(220, 0.5, 1.2, 24, 0);
    rel(ia, 20);
    rel(omega, 175);
    rel(backEmf(1.2, 1, omega), 210);
    rel(radPerSecToRpm(omega), 1671.127, 1e-6);
    rel(developedTorque(1.2, 1, ia), 24);
  });

  it('power balance: Pin 4400 W, Pcu 200 W, Pdev 4200 W, η 0.954545', () => {
    const ia = 20;
    const pin = 220 * ia;
    const pcu = ia * ia * 0.5;
    const pdev = backEmf(1.2, 1, 175) * ia;
    rel(pin, 4400);
    rel(pcu, 200);
    rel(pdev, 4200);
    rel(pdev / pin, 0.954545, 1e-6);
  });

  it('starting current 440 A', () => {
    rel(startingCurrent(220, 0.5), 440);
  });
});

describe('RC-M01-02 converter-fed drive (Tutorial 2 Q2)', () => {
  it('Vm 622.254, Vf 396.139, If 2.26365, Td 142.610, Va 198.070, Eg 186.820, ω 58.9501, 562.93 rpm, Pi 9809.85 W', () => {
    const vm = peakFromRms(440);
    rel(vm, 622.254);
    const vf = converterAverageVoltage('single-full', vm, 0);
    rel(vf, 396.139);
    const ifield = fieldCurrent(vf, 175);
    rel(ifield, 2.26365);
    rel(developedTorque(1.4, ifield, 45), 142.61);
    const va = converterAverageVoltage('single-full', vm, degToRad(60));
    rel(va, 198.07);
    const eg = va - 45 * 0.25;
    rel(eg, 186.82);
    const omega = eg / (1.4 * ifield);
    rel(omega, 58.9501);
    rel(radPerSecToRpm(omega), 562.93);
    rel(va * 45 + vf * ifield, 9809.85);
  });
});

describe('RC-M01-03 course Tutorial 1', () => {
  it('Q6 series motor: Ia 21.7391 A, T 79.5775 N·m', () => {
    rel(10_000 / 0.92 / 500, 21.7391);
    rel(10_000 / rpmToRadPerSec(1200), 79.5775);
  });

  it('Q7 series motor speed after a change of current and flux: 1750 rpm', () => {
    rel(speedFromEmfRatio(1000, 300 - 50 * 1.5, 300 - 25 * 1.5, 0.03, 0.02), 1750);
  });

  it('Q8 kΦ 3.18310, Ia 94.2478 A; Q9 field weakened kΦ 1.59155, T 150 N·m', () => {
    const k8 = machineConstant(500, rpmToRadPerSec(1500));
    rel(k8, 3.1831);
    rel(300 / k8, 94.2478);
    const k9 = machineConstant(500, rpmToRadPerSec(3000));
    rel(k9, 1.59155);
    rel(k9 * (300 / k8), 150);
  });
});

describe('RC-M01-05 VADL cases', () => {
  it('starting resistance 5.0 Ω limits 220 V / 0.5 Ω start to 40 A', () => {
    rel(startingResistance(220, 0.5, 40), 5);
  });

  it('field weakening: Ia 20 A, ω 350 rad/s (3342.25 rpm)', () => {
    const { ia, omega } = steadyStateSeparate(220, 0.5, 0.6, 12, 0);
    rel(ia, 20);
    rel(omega, 350);
    rel(radPerSecToRpm(omega), 3342.25);
  });

  it('series motor, linear magnetics: Ia 31.6228 A, Eg 204.189 V, ω 161.425 rad/s, η 0.92813', () => {
    const ia = Math.sqrt(40 / 0.04);
    rel(ia, 31.6228);
    rel(seriesTorque(0.04, ia), 40);
    const eg = 220 - ia * 0.5;
    rel(eg, 204.189);
    const omega = eg / (0.04 * ia);
    rel(omega, 161.425);
    rel(seriesBackEmf(0.04, ia, omega), 204.189);
    rel(radPerSecToRpm(omega), 1541.5);
    rel((40 * omega) / (220 * ia), 0.92813);
  });

  it('load law at 1000 rpm (Tr 24 N·m at 1500 rpm): k 0 → 24, 1 → 16, 2 → 10.6667, −1 → 36 N·m', () => {
    rel(loadTorque(1, 24, 1000, 1500, 0), 24);
    rel(loadTorque(1, 24, 1000, 1500, 1), 16);
    rel(loadTorque(1, 24, 1000, 1500, 2), 10.6667);
    rel(loadTorque(1, 24, 1000, 1500, -1), 36);
  });

  it('viscous friction B 0.01: ω 174.394 rad/s, Ia 21.4533 A', () => {
    const { ia, omega } = steadyStateSeparate(220, 0.5, 1.2, 24, 0.01);
    rel(omega, 174.394);
    rel(ia, 21.4533);
  });
});
