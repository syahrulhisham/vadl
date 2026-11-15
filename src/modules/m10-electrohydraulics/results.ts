/** Results-table columns, recorded parameters and report definition for M10. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { hydraulicsModel, type HydraulicsParams } from '@/sim-core';
import { M10_OUTCOMES, M10_THEORY } from './content.en';

const MPA = 1e-6;
const LPM = 60_000;

export function numericParameters(p: HydraulicsParams): Record<string, number> {
  return {
    pumpFlow: p.pumpFlow,
    reliefSetting: p.reliefSetting,
    bore: p.bore,
    rod: p.rod,
    stroke: p.stroke,
    loadForce: p.loadForce,
    throttle: p.throttle,
    pumpOn: p.pumpOn ? 1 : 0,
    lever: p.lever ? 1 : 0,
  };
}

export const M10_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
  { source: 'parameters', key: 'loadForce', label: 'load', unit: 'N' },
  { source: 'measurements', key: 'positionMm', label: 'x', unit: 'mm' },
  { source: 'measurements', key: 'velocity', label: 'v', unit: 'm/s' },
  { source: 'measurements', key: 'pumpPressure', label: 'p P', unit: 'MPa', scale: MPA },
  { source: 'measurements', key: 'capPressure', label: 'p A', unit: 'MPa', scale: MPA },
  { source: 'measurements', key: 'rodPressure', label: 'p B', unit: 'MPa', scale: MPA },
  { source: 'measurements', key: 'reliefFlow', label: 'q relief', unit: 'L/min', scale: LPM },
  { source: 'measurements', key: 'drivePower', label: 'P drive', unit: 'W' },
];

export const M10_REPORT: ReportDefinition = {
  moduleId: 'm10-electrohydraulics',
  title: 'BELK 3423 Virtual Laboratory — Hydraulics and Electrohydraulics (Labs 4a, 4b)',
  objectives: M10_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M10_THEORY.equations, M10_THEORY.model],
  assumptions: hydraulicsModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'pumpFlow', label: 'q', unit: 'L/min', scale: LPM },
    { source: 'parameters', key: 'reliefSetting', label: 'relief', unit: 'MPa', scale: MPA },
    { source: 'parameters', key: 'bore', label: 'D', unit: 'mm', scale: 1000 },
    { source: 'parameters', key: 'rod', label: 'd', unit: 'mm', scale: 1000 },
    { source: 'parameters', key: 'loadForce', label: 'load', unit: 'N' },
    { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
  ],
  measurementColumns: M10_RESULT_COLUMNS,
  graph: {
    title: 'Recorded piston speed against flow-control opening',
    x: { source: 'parameters', key: 'throttle', label: 'FCV', unit: '%', scale: 100 },
    y: { source: 'measurements', key: 'velocity', label: 'v', unit: 'm/s' },
  },
};
