import { describe, expect, it } from 'vitest';
import {
  CAM_PRESETS,
  camDisplacementTable,
  camFollowerModel,
  degToRad,
  flatFaceConvexity,
  maxPressureAngle,
  radToDeg,
  riseLaw,
  SimulationRunner,
  stageDirection,
  TRANSMISSION_PRESETS,
  transmissionModel,
  type CamParams,
  type TransmissionParams,
} from '@/sim-core';

const tErrors = (p: TransmissionParams) =>
  transmissionModel.validate(p).filter((i) => i.severity === 'error');
const cErrors = (p: CamParams) =>
  camFollowerModel.validate(p).filter((i) => i.severity === 'error');
const P = TRANSMISSION_PRESETS.simple;

describe('transmission validation', () => {
  it('accepts every preset', () => {
    for (const p of Object.values(TRANSMISSION_PRESETS)) expect(tErrors(p)).toEqual([]);
  });

  it('rejects fractional teeth, idlers on belts, too many stages, and T1 < T2', () => {
    const g = P.stages[0] as TransmissionParams['stages'][number];
    expect(tErrors({ ...P, stages: [{ ...g, driver: 12.5 }] })[0]?.message).toMatch(
      /whole numbers/,
    );
    expect(
      tErrors({
        ...P,
        stages: [{ kind: 'belt-open', driver: 0.1, driven: 0.2, idler: 20, efficiency: 1 }],
      })[0]?.message,
    ).toMatch(/idler/);
    expect(tErrors({ ...P, stages: [g, g, g, g] })[0]?.parameter).toBe('stages');
    expect(tErrors({ ...P, beltTight: 100, beltSlack: 200 })[0]?.message).toMatch(/tight-side/);
    expect(tErrors({ ...P, liftSupports: 2.5 })[0]?.parameter).toBe('liftSupports');
  });

  it('warns about belt ratios beyond 3:1', () => {
    const w = transmissionModel.validate({
      ...P,
      stages: [{ kind: 'belt-open', driver: 0.05, driven: 0.25, idler: 0, efficiency: 1 }],
    });
    expect(w).toEqual([expect.objectContaining({ severity: 'warning' })]);
  });

  it('direction rules: gear reverses, gear with idler and open belt and chain keep, crossed belt reverses', () => {
    expect([
      stageDirection('gear', 1),
      stageDirection('belt-open'),
      stageDirection('chain'),
    ]).toEqual([1, 1, 1]);
    expect(stageDirection('belt-crossed')).toBe(-1);
  });
});

describe('transmission model', () => {
  it('shaft angles turn in proportion: after one input turn the 2:1 speed-up shaft has turned twice the other way', () => {
    const r = new SimulationRunner(transmissionModel, P);
    r.runFor(0.5); // 120 rpm → one turn
    const o = r.outputs;
    expect(o.angle0).toBeCloseTo(2 * Math.PI, 6);
    expect(o.angle1).toBeCloseTo(-4 * Math.PI, 6);
    expect(o.speedRpm1).toBeCloseTo(-240, 9);
  });

  it('idler speed and angle outputs; efficiency reduces output torque', () => {
    const o = transmissionModel.outputs(0, [1], TRANSMISSION_PRESETS.idler);
    expect(o.idlerSpeedRpm1).toBeCloseTo(-342.857, 3);
    expect(o.idlerAngle1).toBeCloseTo(-16 / 28, 9);
    const p = {
      ...TRANSMISSION_PRESETS.idler,
      stages: TRANSMISSION_PRESETS.idler.stages.map((s) => ({ ...s, efficiency: 0.95 })),
    };
    expect(transmissionModel.outputs(0, [0], p).outputTorque).toBeCloseTo(49.875, 9);
  });

  it('step size: one tenth of a radian of the fastest shaft; standstill uses 1 s', () => {
    expect(transmissionModel.fastestTimeConstant(P)).toBeCloseTo(
      1 / ((240 * 2 * Math.PI) / 60),
      12,
    );
    expect(transmissionModel.fastestTimeConstant({ ...P, inputSpeed: 0 })).toBe(1);
    expect(transmissionModel.outputs(0, [1], { ...P, inputSpeed: 0 }).angle1).toBe(0);
  });
});

describe('cam laws', () => {
  it('every law starts at 0 and ends at 1 with matching slopes', () => {
    for (const law of ['uniform', 'shm', 'uniform-acceleration', 'cycloidal'] as const) {
      expect(riseLaw(law, 0).y).toBeCloseTo(0, 12);
      expect(riseLaw(law, 1).y).toBeCloseTo(1, 12);
      expect(riseLaw(law, 0.5).y).toBeCloseTo(0.5, 12);
      // Numerical derivative matches dy.
      const h = 1e-6;
      expect((riseLaw(law, 0.3 + h).y - riseLaw(law, 0.3 - h).y) / (2 * h)).toBeCloseTo(
        riseLaw(law, 0.3).dy,
        5,
      );
    }
    expect(riseLaw('uniform', 2).y).toBe(1);
  });
});

describe('cam model', () => {
  it('accepts presets; rejects a programme longer than 360°; ranges', () => {
    for (const p of Object.values(CAM_PRESETS)) expect(cErrors(p)).toEqual([]);
    const p = CAM_PRESETS.course;
    expect(cErrors({ ...p, dwellAngle: degToRad(30) })[0]?.message).toMatch(/cannot exceed 360°/);
    expect(cErrors({ ...p, lift: 0 })[0]?.parameter).toBe('lift');
    expect(cErrors({ ...CAM_PRESETS.dwells, rollerRadius: 0.1 })[0]?.parameter).toBe(
      'rollerRadius',
    );
  });

  it('warns about a steep pressure angle and a flat-face cusp', () => {
    const steep = {
      ...CAM_PRESETS.course,
      lift: 0.08,
      riseAngle: degToRad(40),
      returnAngle: degToRad(40),
      baseRadius: 0.015,
    };
    expect(radToDeg(maxPressureAngle(steep))).toBeGreaterThan(30);
    expect(camFollowerModel.validate(steep)).toEqual([
      expect.objectContaining({ severity: 'warning' }),
    ]);
    const cusp = {
      ...CAM_PRESETS.flatShm,
      lift: 0.08,
      riseAngle: degToRad(40),
      returnAngle: degToRad(40),
      baseRadius: 0.015,
    };
    expect(flatFaceConvexity(cusp)).toBeLessThan(0);
    expect(camFollowerModel.validate(cusp)[0]?.message).toMatch(/cusp/);
    expect(maxPressureAngle(CAM_PRESETS.flatShm)).toBe(0);
  });

  it('runs: the cam angle wraps after a turn; outputs in mm and rpm; flat follower has no pressure angle', () => {
    const r = new SimulationRunner(camFollowerModel, {
      ...CAM_PRESETS.course,
      camSpeed: 2 * Math.PI,
    });
    r.runFor(1.25);
    expect(r.outputs.camAngleDeg).toBeCloseTo(90, 6);
    expect(r.outputs.displacementMm).toBeCloseTo(15, 6);
    expect(r.outputs.camSpeedRpm).toBeCloseTo(60, 9);
    expect(r.outputs.segment).toBe(0);
    const f = camFollowerModel.outputs(0, [1], CAM_PRESETS.flatShm);
    expect(f.pressureAngleDeg).toBe(0);
    expect(
      camFollowerModel.fastestTimeConstant({ ...CAM_PRESETS.course, camSpeed: 0 }),
    ).toBeCloseTo(1, 12);
  });

  it('displacement table at 45° and 22.5° covers the turn and returns to zero', () => {
    expect(camDisplacementTable(CAM_PRESETS.course, 45)).toHaveLength(9);
    const t = camDisplacementTable(CAM_PRESETS.dwells, 22.5);
    expect(t).toHaveLength(17);
    expect(t[t.length - 1]?.displacement).toBe(0);
  });
});
