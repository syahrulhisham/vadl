/** Results-table columns, recorded parameters and report definition for M09. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { electroPneumaticsModel, type ElectroPneumaticsParams } from '@/sim-core';
import { M09_OUTCOMES, M09_THEORY } from './content.en';

export function numericParameters(p: ElectroPneumaticsParams): Record<string, number> {
  return {
    supply: p.supply,
    stroke: p.stroke,
    throttle: p.throttle,
    timerDelay: p.timerDelay,
    rungs: p.ladder.length,
    s1: p.s1 ? 1 : 0,
    s2: p.s2 ? 1 : 0,
    s3: p.s3 ? 1 : 0,
  };
}

export const M09_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'time', key: 't', label: 't', unit: 's' },
  { source: 'parameters', key: 's1', label: 'S1', unit: '1/0' },
  { source: 'parameters', key: 's2', label: 'S2', unit: '1/0' },
  { source: 'measurements', key: 'coil_K1', label: 'K1', unit: '1/0' },
  { source: 'measurements', key: 'coil_1M1', label: '1M1', unit: '1/0' },
  { source: 'measurements', key: 'coil_1M2', label: '1M2', unit: '1/0' },
  { source: 'measurements', key: 'coil_2M1', label: '2M1', unit: '1/0' },
  { source: 'measurements', key: 'x1Mm', label: 'x 1A1', unit: 'mm' },
  { source: 'measurements', key: 'x2Mm', label: 'x 2A1', unit: 'mm' },
  { source: 'measurements', key: 'supplyCurrent', label: 'I supply', unit: 'A' },
  { source: 'measurements', key: 's1Current', label: 'I S1', unit: 'A' },
];

export const M09_REPORT: ReportDefinition = {
  moduleId: 'm09-electro-pneumatics',
  title: 'BELK 3423 Virtual Laboratory — Electro-pneumatics (Lab 3)',
  objectives: M09_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M09_THEORY.ladder, ...M09_THEORY.electrical],
  assumptions: electroPneumaticsModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'supply', label: 'p', unit: 'bar', scale: 1e-5 },
    { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
    { source: 'parameters', key: 'timerDelay', label: 'T1', unit: 's' },
    { source: 'parameters', key: 'rungs', label: 'rungs', unit: '—' },
  ],
  measurementColumns: M09_RESULT_COLUMNS,
  graph: {
    title: 'Recorded positions: 1A1 against time',
    x: { source: 'time', key: 't', label: 't', unit: 's' },
    y: { source: 'measurements', key: 'x1Mm', label: 'x 1A1', unit: 'mm' },
  },
};
