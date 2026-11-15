/**
 * RC-M08-01 to RC-M10-02. Literals from docs/reference-cases/fluid-power.md.
 */
import { describe, expect, it } from 'vitest';
import {
  annulusArea,
  backPressureForce,
  chokedVelocityFactor,
  coilCurrent,
  coilPower,
  coilVoltage,
  cylinderSpeed,
  drivePower,
  effectiveForce,
  evaluateLadder,
  HYDRAULIC_PASSAGE_AREA,
  HYDRAULIC_PRESETS,
  hydraulicState,
  LADDER_PRESETS,
  loadPressure,
  oilFlow,
  pistonArea,
  pneumaticStroke,
  pumpFlow,
  reliefFlow,
  seriesArea,
  SimulationRunner,
  ELECTRO_PNEUMATIC_PRESETS,
  electroPneumaticsModel,
  theoreticalForce,
  type HydraulicsParams,
} from '@/sim-core';

const rel = (actual: number, expected: number, tol = 1e-5) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol);
const LPM = 1 / 60_000;
const OFF = { S1: false, S2: false, S3: false };
const NOSENSE = { '1B1': false, '1B2': false, '2B1': false, '2B2': false };
const NORELAY = { K1: false, K2: false, K3: false };

describe('RC-M08-01 cylinder forces', () => {
  it('single-acting 20 mm, 6 bar, spring 13.6 N: 188.496 N theoretical, 156.046 N effective', () => {
    rel(pistonArea(0.02), 3.14159e-4);
    rel(theoreticalForce(6e5, pistonArea(0.02)), 188.496);
    rel(effectiveForce(6e5, pistonArea(0.02), 0.1, 13.6), 156.046);
  });
  it('double-acting 20/8 mm: extend 169.646 N, retract 142.503 N', () => {
    rel(effectiveForce(6e5, pistonArea(0.02), 0.1), 169.646);
    rel(annulusArea(0.02, 0.008), 2.63894e-4);
    rel(effectiveForce(6e5, annulusArea(0.02, 0.008), 0.1), 142.503);
  });
  it('plan case 50/20 mm: 1178.10 / 989.602 N ideal, 1060.29 / 890.642 N with friction', () => {
    rel(theoreticalForce(6e5, pistonArea(0.05)), 1178.1);
    rel(theoreticalForce(6e5, annulusArea(0.05, 0.02)), 989.602);
    rel(effectiveForce(6e5, pistonArea(0.05), 0.1), 1060.29);
    rel(effectiveForce(6e5, annulusArea(0.05, 0.02), 0.1), 890.642);
  });
});

describe('RC-M08-02 VADL speed model', () => {
  const Ad = pistonArea(0.02);
  const Ae = annulusArea(0.02, 0.008);
  const fr = 0.1 * 6e5 * Ad;
  const out = seriesArea(1.5e-6, 0.4e-6);
  it('choked factor 198.612 m/s; A_out 0.386494 mm²; meter-out 0.290884 m/s, load-independent', () => {
    rel(chokedVelocityFactor(), 198.612);
    rel(out, 0.386494e-6);
    for (const load of [0, 50, 100])
      rel(pneumaticStroke(6e5, Ad, Ae, fr, load, 1.5e-6, out).speed, 0.290884);
  });
  it('meter-in: 0.934, 0.527, 0.157 m/s at 0, 50, 150 N (1 %)', () => {
    const v = (load: number) => pneumaticStroke(6e5, Ad, Ae, fr, load, out, 1.5e-6).speed;
    rel(v(0), 0.934, 0.01);
    rel(v(50), 0.527, 0.01);
    rel(v(150), 0.157, 0.01);
  });
  it('meter-out, no load: exhaust chamber 6.25 bar (intensification, 1 %)', () => {
    rel(pneumaticStroke(6e5, Ad, Ae, fr, 0, 1.5e-6, out).exhaustPressure, 6.25e5, 0.01);
  });
});

describe('RC-M09-01 electrical values', () => {
  it('48 Ω coil: 0.5 A, 12 W; relay 580 Ω 1 W: 24.0832 V, 41.3793 mA, 0.993103 W', () => {
    rel(coilCurrent(24, 48), 0.5);
    rel(coilPower(24, 48), 12);
    rel(coilCurrent(24, 16), 1.5);
    rel(coilVoltage(1, 580), 24.0832);
    rel(coilCurrent(24, 580), 0.0413793);
    rel(coilPower(24, 580), 0.993103);
  });
});

describe('RC-M09-02 ladder logic', () => {
  it('indirect control: S1 energises K1 and 1M1 in one scan', () => {
    const r = evaluateLadder(LADDER_PRESETS.partB, { ...OFF, S1: true }, NOSENSE, NORELAY, false);
    expect([r.coils.K1, r.coils['1M1'], r.stable]).toEqual([true, true, true]);
  });
  it('latch with dominant reset', () => {
    const L = LADDER_PRESETS.latch;
    const set = evaluateLadder(L, { ...OFF, S1: true }, NOSENSE, NORELAY, false);
    const held = evaluateLadder(L, OFF, NOSENSE, set.relays, false);
    expect(held.coils['1M1']).toBe(true);
    const both = evaluateLadder(L, { ...OFF, S1: true, S2: true }, NOSENSE, held.relays, false);
    expect(both.coils.K1).toBe(false);
  });
  it('Part D: events in the order 1A1+, 2A1+, 1A1−, 2A1−', () => {
    const p = { ...ELECTRO_PNEUMATIC_PRESETS.partD, s1: true };
    const r = new SimulationRunner(electroPneumaticsModel, p);
    const events: string[] = [];
    let last = { v1: 0, v2: 0 };
    const note = () => {
      const o = r.outputs;
      const sign = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
      if (sign(o.v1) !== sign(last.v1) && o.v1 !== 0) events.push(o.v1 > 0 ? '1A1+' : '1A1−');
      if (sign(o.v2) !== sign(last.v2) && o.v2 !== 0) events.push(o.v2 > 0 ? '2A1+' : '2A1−');
      last = { v1: o.v1, v2: o.v2 };
    };
    for (let i = 0; i < 400; i += 1) {
      if (i === 200) {
        r.start();
        r.setParams({ ...p, s1: false });
      }
      r.runFor(0.01);
      note();
    }
    expect(events).toEqual(['1A1+', '2A1+', '1A1−', '2A1−']);
  });
});

describe('RC-M10-01 hydraulics (course values)', () => {
  const AP = 2.0e-4;
  const APR = 1.2e-4;
  const q = 2 * LPM;
  it('load pressure 0.75 MPa; retract 0.277778 m/s, 0.72 s; advance 0.166667 m/s, 1.2 s; ratios', () => {
    rel(loadPressure(90, APR), 0.75e6);
    rel(cylinderSpeed(q, APR), 0.277778);
    rel(0.2 / cylinderSpeed(q, APR), 0.72);
    rel(AP / APR, 1.66667);
    rel(cylinderSpeed(q, AP), 0.166667);
    rel(0.2 / cylinderSpeed(q, AP), 1.2);
    rel(cylinderSpeed(q, AP) / cylinderSpeed(q, APR), 0.6);
  });
  it('exact 16/10 areas 201.062 / 122.522 mm², ratio 1.64103, stall 1005.31 / 612.611 N at 5 MPa', () => {
    rel(pistonArea(0.016), 201.062e-6);
    rel(annulusArea(0.016, 0.01), 122.522e-6);
    rel(pistonArea(0.016) / annulusArea(0.016, 0.01), 1.64103);
    rel(theoreticalForce(5e6, pistonArea(0.016)), 1005.31);
    rel(theoreticalForce(5e6, annulusArea(0.016, 0.01)), 612.611);
  });
  it('back pressure 8933.90 N; fill time 5.89049 s; drive power 238.095 / 14.2857 W; pumps 4.06 / 2.224 L/min', () => {
    rel(backPressureForce(pistonArea(0.05), 50e5, annulusArea(0.05, 0.025), 6e5), 8933.9);
    rel((pistonArea(0.05) * 0.25) / (5 * LPM), 5.89049);
    rel(drivePower(5e6, q), 238.095);
    rel(drivePower(0.3e6, q), 14.2857);
    rel(pumpFlow(2.8e-6, 1450 / 60) / LPM, 4.06);
    rel(pumpFlow(1.6e-6, 1390 / 60) / LPM, 2.224);
  });
});

describe('RC-M10-02 VADL hydraulic flow model', () => {
  const q = 2 * LPM;
  it('passage 3.10913 mm²; relief flow 0, 1, 2 L/min at 4.6, 4.8, 5.0 MPa', () => {
    rel(HYDRAULIC_PASSAGE_AREA, 3.10913e-6);
    expect(reliefFlow(4.6e6, 5e6, q)).toBe(0);
    rel(reliefFlow(4.8e6, 5e6, q) / LPM, 1);
    rel(reliefFlow(5.0e6, 5e6, q) / LPM, 2);
  });
  it('gravity lowering of 90 N at 0.75 MPa: 5.37853, 3.36581, 1.81642 L/min', () => {
    const lower = (open: number) =>
      oilFlow(seriesArea(HYDRAULIC_PASSAGE_AREA, 3e-6 * open), 0.75e6) / LPM;
    rel(lower(1), 5.37853);
    rel(lower(0.5), 3.36581);
    rel(lower(0.25), 1.81642);
  });
  it('the model lowers at 0.252281 m/s (quarter open) and raises with the pump at 1.40 MPa', () => {
    // Bore and rod chosen to give the lab's rounded areas A_P = 2.0 cm², A_PR = 1.2 cm².
    const bore = Math.sqrt((4 * 2.0e-4) / Math.PI);
    const rod = Math.sqrt((4 * 0.8e-4) / Math.PI);
    const p: HydraulicsParams = { ...HYDRAULIC_PRESETS['4a-ex2'], bore, rod, throttle: 0.25 };
    rel(hydraulicState(p, 'lower', 0.1).speed, 0.252281);
    const up = hydraulicState({ ...p, pumpOn: true }, 'retract', 0.1);
    rel(up.speed, 0.277778, 1e-4);
    rel(up.pumpPressure, 1.4e6, 1e-3);
  });
});
