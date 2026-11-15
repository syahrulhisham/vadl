/**
 * Units module against hand-calculated values.
 * Expected numbers are written out literally (worked by hand, see comments), not
 * recomputed with the same formula, so a wrong factor in the code is caught.
 */
import { describe, expect, it } from 'vitest';
import {
  cleanResidue,
  barToPa,
  cubicMetresPerSecToLitresPerMin,
  degToRad,
  formatSignificant,
  litresPerMinToCubicMetresPerSec,
  mmToM,
  mToMm,
  paToBar,
  radPerSecToRpm,
  radToDeg,
  rpmToRadPerSec,
} from '@/sim-core/units';

describe('angular velocity', () => {
  it('converts 1500 rpm to 157.0796 rad/s (= 1500 × 2π / 60 = 50π)', () => {
    expect(rpmToRadPerSec(1500)).toBeCloseTo(157.079633, 5);
  });

  it('converts 175 rad/s to 1671.127 rpm (DC motor reference case: 175 × 60 / 2π)', () => {
    expect(radPerSecToRpm(175)).toBeCloseTo(1671.1269, 4);
  });

  it('converts 2π rad/s to exactly 60 rpm (one revolution per second)', () => {
    expect(radPerSecToRpm(2 * Math.PI)).toBeCloseTo(60, 12);
  });

  it('round-trips rpm → rad/s → rpm', () => {
    expect(radPerSecToRpm(rpmToRadPerSec(1440))).toBeCloseTo(1440, 10);
  });
});

describe('pressure', () => {
  it('converts 6 bar to 600 000 Pa (1 bar = 10⁵ Pa exactly)', () => {
    expect(barToPa(6)).toBe(600_000);
  });

  it('converts 100 bar to 10 MPa', () => {
    expect(barToPa(100)).toBe(10_000_000);
  });

  it('converts 250 000 Pa to 2.5 bar', () => {
    expect(paToBar(250_000)).toBe(2.5);
  });
});

describe('volumetric flow', () => {
  it('converts 10 L/min to 1.6667 × 10⁻⁴ m³/s (10 × 10⁻³ m³ / 60 s)', () => {
    expect(litresPerMinToCubicMetresPerSec(10)).toBeCloseTo(1.666667e-4, 9);
  });

  it('converts 60 L/min to exactly 1 × 10⁻³ m³/s', () => {
    expect(litresPerMinToCubicMetresPerSec(60)).toBeCloseTo(1e-3, 15);
  });

  it('converts 1 × 10⁻³ m³/s back to 60 L/min', () => {
    expect(cubicMetresPerSecToLitresPerMin(1e-3)).toBeCloseTo(60, 12);
  });
});

describe('length and angle', () => {
  it('converts 63 mm to 0.063 m and back', () => {
    expect(mmToM(63)).toBeCloseTo(0.063, 15);
    expect(mToMm(0.063)).toBeCloseTo(63, 12);
  });

  it('converts 180° to π rad and 1.8° (stepper step angle) to 0.0314159 rad', () => {
    expect(degToRad(180)).toBeCloseTo(3.14159265, 8);
    expect(degToRad(1.8)).toBeCloseTo(0.03141593, 8);
  });

  it('converts π/2 rad to 90°', () => {
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 12);
  });
});

describe('formatSignificant', () => {
  it('rounds to the requested significant figures', () => {
    expect(formatSignificant(1671.1269, 5)).toBe('1671.1');
    expect(formatSignificant(0.0456789, 3)).toBe('0.0457');
    expect(formatSignificant(-210.04, 4)).toBe('-210');
  });

  it('defaults to 4 significant figures', () => {
    expect(formatSignificant(95.454545)).toBe('95.45');
  });

  it('uses exponent notation outside 10⁻³ … 10⁶', () => {
    expect(formatSignificant(1.666667e-4, 4)).toBe('1.667e-4');
    expect(formatSignificant(10_000_000, 3)).toBe('1.00e+7');
  });

  it('shows zero as 0', () => {
    expect(formatSignificant(0)).toBe('0');
  });

  it('never shows a non-finite value as a number', () => {
    expect(formatSignificant(Number.NaN)).toBe('—');
    expect(formatSignificant(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('rejects an invalid significant-figure count', () => {
    expect(() => formatSignificant(1, 0)).toThrow(RangeError);
    expect(() => formatSignificant(1, 2.5)).toThrow(RangeError);
  });
});

describe('cleanResidue', () => {
  it('turns integration residue below 1e-9 into exact zero and keeps real values', () => {
    expect(cleanResidue(1.066e-14)).toBe(0);
    expect(cleanResidue(-6.1e-13)).toBe(0);
    expect(cleanResidue(2e-6)).toBe(2e-6);
    expect(cleanResidue(5e-4, 1e-3)).toBe(0);
    expect(Number.isNaN(cleanResidue(Number.NaN))).toBe(true);
  });
});
