/** Results-table columns, recorded parameters and report definition for M03. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { powerConverterModel, type PowerConverterParams } from '@/sim-core';
import { M03_OUTCOMES, M03_THEORY } from './content.en';

const DEG = 180 / Math.PI;

export function numericParameters(p: PowerConverterParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  return out;
}

/** Lab 1 table layout: supply, α, averages and rms values, then derived figures. */
export const M03_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'parameters', key: 'supplyRms', label: 'Vs', unit: 'V' },
  { source: 'parameters', key: 'alpha', label: 'α', unit: '°', scale: DEG },
  { source: 'parameters', key: 'duty', label: 'D', unit: '—' },
  { source: 'parameters', key: 'modulationIndex', label: 'ma', unit: '—' },
  { source: 'measurements', key: 'vAverage', label: 'Vavg', unit: 'V' },
  { source: 'measurements', key: 'vRms', label: 'Vrms', unit: 'V' },
  { source: 'measurements', key: 'iAverage', label: 'Iavg', unit: 'A' },
  { source: 'measurements', key: 'iRms', label: 'Irms', unit: 'A' },
  { source: 'measurements', key: 'outputPower', label: 'P', unit: 'W' },
  { source: 'measurements', key: 'vFundamental', label: 'V1', unit: 'V' },
  { source: 'measurements', key: 'thd', label: 'THD', unit: '%', scale: 100 },
];

export const M03_REPORT: ReportDefinition = {
  moduleId: 'm03-power-converters',
  title: 'BELK 3423 Virtual Laboratory — Power Converters (Lab 1)',
  objectives: M03_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M03_THEORY.rectifier, ...M03_THEORY.dcdc, ...M03_THEORY.inverter],
  assumptions: powerConverterModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'supplyRms', label: 'Vs', unit: 'V' },
    { source: 'parameters', key: 'supplyFrequency', label: 'f', unit: 'Hz' },
    { source: 'parameters', key: 'alpha', label: 'α', unit: '°', scale: DEG },
    { source: 'parameters', key: 'loadResistance', label: 'R', unit: 'Ω' },
    { source: 'parameters', key: 'duty', label: 'D', unit: '—' },
    { source: 'parameters', key: 'dcInput', label: 'Vs (DC)', unit: 'V' },
    { source: 'parameters', key: 'modulationIndex', label: 'ma', unit: '—' },
  ],
  measurementColumns: M03_RESULT_COLUMNS,
  graph: {
    title: 'Recorded average output voltage against firing angle',
    x: { source: 'parameters', key: 'alpha', label: 'α', unit: '°', scale: DEG },
    y: { source: 'measurements', key: 'vAverage', label: 'Vavg', unit: 'V' },
  },
};
