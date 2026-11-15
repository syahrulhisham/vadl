/** Results-table columns, recorded parameters and report definition for M08. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { pneumaticsModel, type PneumaticsParams } from '@/sim-core';
import { M08_OUTCOMES, M08_THEORY } from './content.en';

export function numericParameters(p: PneumaticsParams): Record<string, number> {
  return {
    supply: p.supply,
    bore: p.bore,
    rod: p.rod,
    stroke: p.stroke,
    springForce: p.springForce,
    friction: p.friction,
    loadForce: p.loadForce,
    throttle: p.throttle,
    meterIn: p.throttleMode === 'meter-in' ? 1 : 0,
  };
}

export const M08_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'parameters', key: 'supply', label: 'p', unit: 'bar', scale: 1e-5 },
  { source: 'parameters', key: 'loadForce', label: 'load', unit: 'N' },
  { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
  { source: 'parameters', key: 'meterIn', label: 'meter-in', unit: '1/0' },
  { source: 'measurements', key: 'extendForce', label: 'F ext', unit: 'N' },
  { source: 'measurements', key: 'retractForce', label: 'F ret', unit: 'N' },
  { source: 'measurements', key: 'extendTime', label: 't ext', unit: 's' },
  { source: 'measurements', key: 'retractTime', label: 't ret', unit: 's' },
  { source: 'measurements', key: 'capPressureBar', label: '1Z1', unit: 'bar' },
  { source: 'measurements', key: 'rodPressureBar', label: '1Z2', unit: 'bar' },
];

export const M08_REPORT: ReportDefinition = {
  moduleId: 'm08-pneumatics',
  title: 'BELK 3423 Virtual Laboratory — Pneumatics (Lab 2)',
  objectives: M08_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M08_THEORY.equations, M08_THEORY.control, M08_THEORY.model],
  assumptions: pneumaticsModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'supply', label: 'p', unit: 'bar', scale: 1e-5 },
    { source: 'parameters', key: 'bore', label: 'D', unit: 'mm', scale: 1000 },
    { source: 'parameters', key: 'rod', label: 'd', unit: 'mm', scale: 1000 },
    { source: 'parameters', key: 'springForce', label: 'spring', unit: 'N' },
    { source: 'parameters', key: 'loadForce', label: 'load', unit: 'N' },
    { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
  ],
  measurementColumns: M08_RESULT_COLUMNS,
  graph: {
    title: 'Recorded extend time against load',
    x: { source: 'parameters', key: 'loadForce', label: 'load', unit: 'N' },
    y: { source: 'measurements', key: 'extendTime', label: 't ext', unit: 's' },
  },
};
