/**
 * RC-M06-01 to RC-M06-06. Literals from docs/reference-cases/transmission.md.
 */
import { describe, expect, it } from 'vitest';
import {
  beltPower,
  beltSpeed,
  beltTorque,
  liftingPulley,
  machineEfficiency,
  mechanicalAdvantage,
  outputSpeed,
  outputTorque,
  radPerSecToRpm,
  rpmToRadPerSec,
  stageDirection,
  stageRatio,
  TRANSMISSION_PRESETS,
  transmissionModel,
  transmissionShafts,
  velocityRatio,
  type TransmissionParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-9) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);
const rpms = (p: TransmissionParams) =>
  transmissionShafts(p).shafts.map((s) => radPerSecToRpm(s.speed));

describe('RC-M06-01 simple gear pairs', () => {
  it.each([
    [60, 120, 30, 240],
    [25, 60, 75, 20],
    [20, 100, 80, 25],
    [15, 400, 60, 100],
    [20, 60, 30, 40],
  ])('%iT at %i rpm → %iT: %i rpm', (driver, n, driven, out) => {
    rel(outputSpeed(n, stageRatio(driver, driven)), out);
  });
  it('20T → 40T: G = 2; an external mesh reverses', () => {
    rel(stageRatio(20, 40), 2);
    expect(stageDirection('gear')).toBe(-1);
  });
});

describe('RC-M06-02 idler and compound trains', () => {
  it('Tutorial 4 Q4: G 5.25, idler 342.857 rpm ACW, C 114.286 rpm CW', () => {
    const { shafts, idlers } = transmissionShafts(TRANSMISSION_PRESETS.idler);
    rel(shafts[1]?.ratio as number, 5.25);
    rel(radPerSecToRpm(shafts[1]?.speed as number), 114.286, 1e-5);
    rel(radPerSecToRpm(idlers[0]?.speed as number), -342.857, 1e-5);
  });
  it('Example 4: 90 rpm ACW, then 360 rpm CW; overall G 1/12', () => {
    const s = rpms(TRANSMISSION_PRESETS.compound);
    rel(s[1] as number, -90);
    rel(s[2] as number, 360);
    rel(
      transmissionShafts(TRANSMISSION_PRESETS.compound).shafts[2]?.ratio as number,
      0.083333,
      1e-5,
    );
  });
  it('Tutorial 4 Q5: speed-up 11.4286, G 0.0875', () => {
    const g = stageRatio(60, 15) * stageRatio(40, 14);
    rel(g, 0.0875);
    rel(1 / g, 11.4286, 1e-5);
  });
});

describe('RC-M06-03 chain and belt drives', () => {
  it('bicycle chain 60T → 30T at 150 rpm CW: 300 rpm CW', () => {
    rel(rpms(TRANSMISSION_PRESETS.chain)[1] as number, 300);
  });
  it('belt 200 → 400 mm at 20 rpm: G 2, 10 rpm; 200 → 600 mm: G 3', () => {
    rel(outputSpeed(20, stageRatio(0.2, 0.4)), 10);
    rel(stageRatio(0.2, 0.6), 3);
  });
  it('belt train A–F: B 30 rpm CW, D 25 rpm, F 33.3333 rpm CW', () => {
    const s = rpms(TRANSMISSION_PRESETS.beltTrain);
    rel(s[0] as number, -60);
    rel(s[1] as number, 30);
    rel(s[2] as number, 25);
    rel(s[3] as number, 33.3333, 2e-6);
  });
});

describe('RC-M06-04 lifting pulleys', () => {
  it('MA 2, VR 2, η 100 %', () => {
    const ma = mechanicalAdvantage(80, 40);
    const vr = velocityRatio(2, 1);
    rel(ma, 2);
    rel(vr, 2);
    rel(machineEfficiency(ma, vr), 1);
  });
  it('four supports, 100 N: effort 25 N, effort moves 4 m for 1 m; 25 N lifting 150 N: MA 6', () => {
    const l = liftingPulley(4, 100, 1);
    rel(l.effort, 25);
    rel(l.mechanicalAdvantage, 4);
    rel(l.effortDistance, 4);
    rel(mechanicalAdvantage(150, 25), 6);
  });
  it('extension: four supports at 80 % → effort 31.25 N', () => {
    rel(liftingPulley(4, 100, 1, 0.8).effort, 31.25);
  });
});

describe('RC-M06-05 belt tensions', () => {
  const w = rpmToRadPerSec(600);
  it('torques 30 and 75 N·m; v 6.28319 m/s; P 1884.96 W', () => {
    rel(beltTorque(500, 200, 0.1), 30);
    rel(beltTorque(500, 200, 0.25), 75);
    rel(beltSpeed(w, 0.1), 6.28319, 1e-5);
    rel(beltPower(500, 200, beltSpeed(w, 0.1)), 1884.96, 1e-5);
  });
  it('the model reports the same values', () => {
    const p = { ...TRANSMISSION_PRESETS.simple, inputSpeed: w };
    const o = transmissionModel.outputs(0, [0], p);
    rel(o.beltTorqueDriver, 30);
    rel(o.beltPower, 1884.96, 1e-5);
  });
});

describe('RC-M06-06 torque through a train (extension)', () => {
  it('10 N·m through G 5.25 at η 0.95: 49.875 N·m; ideal 52.5 N·m; power conserved 628.319 W', () => {
    rel(outputTorque(10, 5.25, 0.95), 49.875);
    const o = transmissionModel.outputs(0, [0], TRANSMISSION_PRESETS.idler);
    rel(o.outputTorque, 52.5);
    rel(o.inputPower, 628.319, 1e-5);
    rel(o.outputPower, 628.319, 1e-5);
  });
});
