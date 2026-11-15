/** Results-table columns, recorded parameters and report definition for M07. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { camFollowerModel, type CamParams } from '@/sim-core';
import { M07_OUTCOMES, M07_THEORY } from './content.en';

const DEG = 180 / Math.PI;

export function numericParameters(p: CamParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  out.followerType = p.follower === 'knife' ? 0 : p.follower === 'roller' ? 1 : 2;
  return out;
}

export const M07_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'measurements', key: 'camAngleDeg', label: 'θ', unit: '°' },
  { source: 'measurements', key: 'displacementMm', label: 's', unit: 'mm' },
  { source: 'measurements', key: 'velocity', label: 'v', unit: 'mm/s', scale: 1000 },
  { source: 'measurements', key: 'acceleration', label: 'a', unit: 'm/s²' },
  { source: 'measurements', key: 'pressureAngleDeg', label: 'φ', unit: '°' },
  { source: 'measurements', key: 'camSpeedRpm', label: 'N', unit: 'rpm' },
];

export const M07_REPORT: ReportDefinition = {
  moduleId: 'm07-cam-follower',
  title: 'BELK 3423 Virtual Laboratory — Cam and Follower',
  objectives: M07_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M07_THEORY.displacement, ...M07_THEORY.extension],
  assumptions: camFollowerModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'lift', label: 'h', unit: 'mm', scale: 1000 },
    { source: 'parameters', key: 'riseAngle', label: 'rise', unit: '°', scale: DEG },
    { source: 'parameters', key: 'dwellAngle', label: 'dwell', unit: '°', scale: DEG },
    { source: 'parameters', key: 'returnAngle', label: 'return', unit: '°', scale: DEG },
    { source: 'parameters', key: 'baseRadius', label: 'Rb', unit: 'mm', scale: 1000 },
    {
      source: 'parameters',
      key: 'followerType',
      label: 'follower (0 knife, 1 roller, 2 flat)',
      unit: '—',
    },
  ],
  measurementColumns: M07_RESULT_COLUMNS,
  graph: {
    title: 'Recorded displacement diagram: follower displacement against cam angle',
    x: { source: 'measurements', key: 'camAngleDeg', label: 'θ', unit: '°' },
    y: { source: 'measurements', key: 'displacementMm', label: 's', unit: 'mm' },
  },
};
