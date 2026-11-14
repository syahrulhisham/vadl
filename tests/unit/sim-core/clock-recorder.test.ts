import { describe, expect, it } from 'vitest';
import { advanceClock, downsample, INITIAL_CLOCK, Recorder, type Sample } from '@/sim-core';

describe('advanceClock (fixed step with accumulator)', () => {
  it('takes whole steps and carries the remainder to the next frame', () => {
    const a = advanceClock(INITIAL_CLOCK, 0.025, 1, 0.01, 100);
    expect(a.steps).toBe(2);
    expect(a.clock.accumulator).toBeCloseTo(0.005, 12);
    const b = advanceClock(a.clock, 0.005, 1, 0.01, 100);
    expect(b.steps).toBe(1);
    expect(b.clock.accumulator).toBeCloseTo(0, 12);
  });

  it('gives the same number of steps at 30 fps and 120 fps (frame-rate independence)', () => {
    const run = (fps: number) => {
      let clock = INITIAL_CLOCK;
      let steps = 0;
      for (let i = 0; i < fps; i += 1) {
        const a = advanceClock(clock, 1 / fps, 1, 0.001, 10_000);
        clock = a.clock;
        steps += a.steps;
      }
      return steps;
    };
    expect(run(30)).toBe(1000);
    expect(run(120)).toBe(1000);
  });

  it('applies the time scale (simulated seconds per real second)', () => {
    expect(advanceClock(INITIAL_CLOCK, 1, 0.01, 0.001, 100).steps).toBe(10);
  });

  it('caps steps per frame, drops the backlog and reports lagging', () => {
    const a = advanceClock(INITIAL_CLOCK, 1, 1, 0.0001, 500);
    expect(a).toEqual({ clock: { accumulator: 0 }, steps: 500, lagging: true });
  });

  it('treats negative and non-finite elapsed time as zero', () => {
    expect(advanceClock(INITIAL_CLOCK, -1, 1, 0.01, 10).steps).toBe(0);
    expect(advanceClock(INITIAL_CLOCK, Number.NaN, 1, 0.01, 10).steps).toBe(0);
  });

  it('rejects a non-positive step', () => {
    expect(() => advanceClock(INITIAL_CLOCK, 1, 1, 0, 10)).toThrow(RangeError);
  });
});

const sample = (t: number, v: number): Sample => ({ t, values: { v } });

describe('Recorder (bounded ring buffer)', () => {
  it('keeps samples in order until full, then drops the oldest', () => {
    const r = new Recorder(3);
    expect(r.last()).toBeUndefined();
    [1, 2, 3, 4, 5].forEach((t) => r.push(sample(t, t)));
    expect(r.size).toBe(3);
    expect(r.toArray().map((s) => s.t)).toEqual([3, 4, 5]);
    expect(r.last()?.t).toBe(5);
  });

  it('clears', () => {
    const r = new Recorder(4);
    r.push(sample(0, 0));
    r.clear();
    expect(r.size).toBe(0);
    expect(r.toArray()).toEqual([]);
  });

  it('rejects a capacity below 2', () => {
    expect(() => new Recorder(1)).toThrow(RangeError);
    expect(() => new Recorder(2.5)).toThrow(RangeError);
  });
});

describe('downsample (min–max buckets)', () => {
  it('returns short traces unchanged', () => {
    const s = [sample(0, 1), sample(1, 2)];
    expect(downsample(s, 10, 'v')).toEqual(s);
  });

  it('keeps first, last and a single narrow spike', () => {
    const s = Array.from({ length: 1000 }, (_, i) => sample(i, i === 437 ? 99 : 0));
    const d = downsample(s, 50, 'v');
    expect(d.length).toBeLessThanOrEqual(50);
    expect(d[0]?.t).toBe(0);
    expect(d.at(-1)?.t).toBe(999);
    expect(d.some((p) => p.values.v === 99)).toBe(true);
    expect(d.map((p) => p.t)).toEqual([...d.map((p) => p.t)].sort((a, b) => a - b));
  });

  it('rejects maxPoints below 4', () => {
    expect(() => downsample([], 3, 'v')).toThrow(RangeError);
  });
});
