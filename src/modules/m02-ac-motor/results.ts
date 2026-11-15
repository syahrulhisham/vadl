/** Results-table columns, recorded parameters and report definition for M02. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { inductionMotorModel, type InductionMotorParams } from '@/sim-core';
import { M02_OUTCOMES, M02_THEORY } from './content.en';

export function numericParameters(p: InductionMotorParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  return out;
}

export const M02_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'time', key: 't', label: 't', unit: 's' },
  { source: 'measurements', key: 'frequency', label: 'f', unit: 'Hz' },
  { source: 'measurements', key: 'phaseVoltage', label: 'Vs', unit: 'V' },
  { source: 'measurements', key: 'syncSpeedRpm', label: 'Ns', unit: 'rpm' },
  { source: 'measurements', key: 'speedRpm', label: 'N', unit: 'rpm' },
  { source: 'measurements', key: 'slip', label: 'S', unit: '%', scale: 100 },
  { source: 'measurements', key: 'torque', label: 'Td', unit: 'N·m' },
  { source: 'measurements', key: 'statorCurrent', label: 'Is', unit: 'A' },
  { source: 'measurements', key: 'powerFactor', label: 'PF', unit: '—' },
  { source: 'measurements', key: 'inputPower', label: 'Pin', unit: 'W' },
  { source: 'measurements', key: 'outputPower', label: 'Pout', unit: 'W' },
  { source: 'measurements', key: 'efficiency', label: 'η', unit: '%', scale: 100 },
];

export const M02_REPORT: ReportDefinition = {
  moduleId: 'm02-ac-motor',
  title: 'BELK 3423 Virtual Laboratory — AC Motor Drives',
  objectives: M02_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M02_THEORY.equations, ...M02_THEORY.control],
  assumptions: inductionMotorModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'poles', label: 'p', unit: '—' },
    { source: 'parameters', key: 'ratedLineVoltage', label: 'VL rated', unit: 'V' },
    { source: 'parameters', key: 'voltageFactor', label: 'b', unit: '—' },
    { source: 'parameters', key: 'frequency', label: 'f set', unit: 'Hz' },
    { source: 'parameters', key: 'externalRotorResistance', label: "Rx'", unit: 'Ω' },
    { source: 'parameters', key: 'rr', label: "Rr'", unit: 'Ω' },
    { source: 'parameters', key: 'loadRatedTorque', label: 'Tr', unit: 'N·m' },
    { source: 'parameters', key: 'loadExponent', label: 'k', unit: '—' },
  ],
  measurementColumns: M02_RESULT_COLUMNS,
  graph: {
    title: 'Recorded operating points: speed against developed torque',
    x: { source: 'measurements', key: 'torque', label: 'Td', unit: 'N·m' },
    y: { source: 'measurements', key: 'speedRpm', label: 'N', unit: 'rpm' },
  },
};
