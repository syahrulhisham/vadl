/**
 * Seeded pseudo-random numbers for question parameters only (never for
 * measurements). Mulberry32: small, fast and fully reproducible from a 32-bit seed.
 */

export type Rng = () => number;

/** Generator of floats in [0, 1) from a 32-bit integer seed. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] (inclusive). */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** A value from min to max in whole multiples of step (e.g. 0.05 Ω), rounded to avoid float noise. */
export function randStep(rng: Rng, min: number, max: number, step: number): number {
  const n = randInt(rng, 0, Math.round((max - min) / step));
  return Number((min + n * step).toFixed(10));
}

/** One element of a non-empty list. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick from an empty list');
  return items[randInt(rng, 0, items.length - 1)] as T;
}

/** A fresh seed for a new question instance. */
export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
