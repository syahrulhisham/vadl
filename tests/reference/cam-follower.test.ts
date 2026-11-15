/**
 * RC-M07-01 to RC-M07-04. Literals from docs/reference-cases/cam-follower.md.
 */
import { describe, expect, it } from 'vitest';
import {
  CAM_PRESETS,
  camDisplacementTable,
  camFollowerModel,
  camMotion,
  camProfileOf,
  degToRad,
  pressureAngle,
  radToDeg,
  uniformRate,
  type CamParams,
} from '@/sim-core';

const close = (actual: number, expected: number, tol = 1e-9) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol * Math.max(1, Math.abs(expected)));
const mm = (m: number) => m * 1000;

describe('RC-M07-01 uniform velocity, 30 mm over 180° (LN Ch3 Part I)', () => {
  const p = CAM_PRESETS.course;
  it('rate 0.166667 mm per degree', () => {
    close(mm(uniformRate(p.lift, p.riseAngle)) * (Math.PI / 180), 0.166667, 1e-6);
  });
  it('displacement every 30°: 0, 5, 10, 15, 20, 25, 30, 25, …, 5, 0 mm', () => {
    const t = camDisplacementTable(p, 30).map((r) => Math.round(mm(r.displacement) * 1e6) / 1e6);
    expect(t).toEqual([0, 5, 10, 15, 20, 25, 30, 25, 20, 15, 10, 5, 0]);
  });
  it('at 60 rpm the follower rises at 0.06 m/s', () => {
    const q: CamParams = { ...p, camSpeed: 2 * Math.PI };
    close(camFollowerModel.outputs(0, [degToRad(45)], q).velocity, 0.06);
  });
});

describe('RC-M07-02 other laws (extension)', () => {
  const base = { ...CAM_PRESETS.course };
  const at = (law: CamParams['law'], deg: number) =>
    mm(camMotion({ ...base, law }, degToRad(deg)).s);
  it('SHM 7.5 mm at 60°; uniform acceleration 3.75 and 26.25 mm; cycloidal 2.72535 mm', () => {
    close(at('shm', 60), 7.5);
    close(at('uniform-acceleration', 45), 3.75);
    close(at('uniform-acceleration', 135), 26.25);
    close(at('cycloidal', 45), 2.72535, 1e-6);
  });
  it('peak velocities at 60 rpm: SHM 0.0942478, UA and cycloidal 0.12 m/s; SHM peak acceleration 0.592176 m/s²', () => {
    const w = 2 * Math.PI;
    close(camMotion({ ...base, law: 'shm' }, degToRad(90)).ds * w, 0.0942478, 1e-6);
    close(camMotion({ ...base, law: 'uniform-acceleration' }, degToRad(90)).ds * w, 0.12);
    close(camMotion({ ...base, law: 'cycloidal' }, degToRad(90)).ds * w, 0.12);
    close(camMotion({ ...base, law: 'shm' }, 0).d2s * w * w, 0.592176, 1e-6);
  });
});

describe('RC-M07-03 rise, dwell, return, dwell', () => {
  it('10, 20, 13.3333 and 0 mm at 60°, 150°, 210°, 300°', () => {
    const p = CAM_PRESETS.dwells;
    close(mm(camMotion(p, degToRad(60)).s), 10);
    close(mm(camMotion(p, degToRad(150)).s), 20);
    close(mm(camMotion(p, degToRad(210)).s), 13.3333, 1e-5);
    close(mm(camMotion(p, degToRad(300)).s), 0);
  });
});

describe('RC-M07-04 pressure angle and profile invariants', () => {
  it('roller Rb 40, Rr 10 at 90°: φ = 8.35767°', () => {
    const m = camMotion(CAM_PRESETS.course, degToRad(90));
    close(radToDeg(pressureAngle(m.ds, m.s, 0.05)), 8.35767, 1e-6);
  });

  const world = (pt: { x: number; y: number }, theta: number) => ({
    // Cam frame → world: rotate clockwise by θ.
    x: pt.x * Math.cos(theta) + pt.y * Math.sin(theta),
    y: -pt.x * Math.sin(theta) + pt.y * Math.cos(theta),
  });
  const angles = [0, 37, 90, 150, 200, 275, 330];

  it('knife-edge: profile radius Rb + s at the contact angle', () => {
    const p: CamParams = { ...CAM_PRESETS.course, follower: 'knife' };
    const prof = camProfileOf(p, 720);
    for (const deg of [0, 30, 90, 180, 270]) {
      const pt = prof[deg * 2] as { x: number; y: number };
      close(Math.hypot(pt.x, pt.y), p.baseRadius + camMotion(p, degToRad(deg)).s, 1e-9);
    }
  });

  it('roller: every profile point stays at least Rr from the roller centre, touching it', () => {
    const p: CamParams = { ...CAM_PRESETS.course, follower: 'roller' };
    const prof = camProfileOf(p, 720);
    for (const deg of angles) {
      const th = degToRad(deg);
      const c = p.baseRadius + p.rollerRadius + camMotion(p, th).s;
      const d = Math.min(
        ...prof.map((q) => {
          const w = world(q, th);
          return Math.hypot(w.x, w.y - c);
        }),
      );
      expect(Math.abs(d - p.rollerRadius)).toBeLessThan(1e-5);
    }
  });

  it('flat-faced: the profile reaches exactly Rb + s along the follower axis', () => {
    const p: CamParams = { ...CAM_PRESETS.flatShm };
    const prof = camProfileOf(p, 720);
    for (const deg of angles) {
      const th = degToRad(deg);
      const top = Math.max(...prof.map((q) => world(q, th).y));
      expect(Math.abs(top - (p.baseRadius + camMotion(p, th).s))).toBeLessThan(1e-5);
    }
  });
});
