/**
 * Pure data preparation for charts. Converts recorded SI samples into plotting
 * rows in display units, downsampled so long traces stay fast (risk R10).
 */
import { downsample, type Sample } from '@/sim-core';

export interface SeriesSpec {
  /** Output key in the recorded samples. */
  readonly key: string;
  readonly label: string;
  /** Display unit, e.g. "A", "mA". */
  readonly unit: string;
  /** Multiplier from SI to the display unit (e.g. 1000 for A → mA). Default 1. */
  readonly scale?: number;
  /** Line colour (a design token value). */
  readonly color: string;
  /** Dashed line, for reference curves such as an analytic solution. */
  readonly dashed?: boolean;
}

export type ChartRow = Readonly<Record<string, number>>;

/** Maximum points sent to a chart. */
export const MAX_CHART_POINTS = 600;

/**
 * Turn recorded samples into chart rows `{ t, <key>... }`.
 * @param timeScale multiplier from seconds to the display time unit (1000 for ms).
 */
export function toTimeRows(
  samples: readonly Sample[],
  series: readonly SeriesSpec[],
  timeScale: number,
  maxPoints = MAX_CHART_POINTS,
): ChartRow[] {
  const first = series[0];
  if (!first) return [];
  const reduced = downsample(samples, maxPoints, first.key);
  return reduced.map((s) => {
    const row: Record<string, number> = { t: s.t * timeScale };
    for (const spec of series) {
      const v = s.values[spec.key];
      if (v !== undefined) row[spec.key] = v * (spec.scale ?? 1);
    }
    return row;
  });
}

/** Pick a display time unit for a run lasting `duration` seconds. */
export function timeUnitFor(duration: number): {
  readonly unit: 'ms' | 's';
  readonly scale: number;
} {
  return duration < 1 ? { unit: 'ms', scale: 1000 } : { unit: 's', scale: 1 };
}

/** Evenly spaced points of y = f(x) on [x0, x1], for reference and characteristic curves. */
export function sampleCurve(
  f: (x: number) => number,
  x0: number,
  x1: number,
  points = 101,
): { x: number; y: number }[] {
  if (points < 2) throw new RangeError('points must be at least 2');
  return Array.from({ length: points }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / (points - 1);
    return { x, y: f(x) };
  });
}
