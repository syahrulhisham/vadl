/** Results-table columns, recorded parameters and report definition for M05. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { servoMotorModel, type ServoParams } from '@/sim-core';
import { M05_OUTCOMES, M05_THEORY } from './content.en';

export function numericParameters(p: ServoParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  out.positionMode = p.mode === 'position' ? 1 : 0;
  return out;
}

export const M05_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'time', key: 't', label: 't', unit: 's' },
  { source: 'parameters', key: 'kp', label: 'Kp', unit: '—' },
  { source: 'parameters', key: 'ki', label: 'Ki', unit: '1/s' },
  { source: 'parameters', key: 'loadTorque', label: 'TL', unit: 'N·m' },
  { source: 'measurements', key: 'referenceDeg', label: 'θref', unit: '°' },
  { source: 'measurements', key: 'positionDeg', label: 'θ', unit: '°' },
  { source: 'measurements', key: 'speedRpm', label: 'N', unit: 'rpm' },
  { source: 'measurements', key: 'driveSignal', label: 'Ve', unit: 'V' },
  { source: 'measurements', key: 'armatureVoltage', label: 'Va', unit: 'V' },
  { source: 'measurements', key: 'armatureCurrent', label: 'Ia', unit: 'A' },
  { source: 'measurements', key: 'overshootPercent', label: 'Mp', unit: '%' },
  { source: 'measurements', key: 'settlingTime', label: 'ts', unit: 's' },
];

export const M05_REPORT: ReportDefinition = {
  moduleId: 'm05-servo',
  title: 'BELK 3423 Virtual Laboratory — Servo Motors',
  objectives: M05_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M05_THEORY.blocks, ...M05_THEORY.sensors, ...M05_THEORY.extension],
  assumptions: servoMotorModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'positionMode', label: 'position (1) / speed (0)', unit: '—' },
    { source: 'parameters', key: 'referenceValue', label: 'ref', unit: 'rad or rad/s' },
    { source: 'parameters', key: 'kp', label: 'Kp', unit: '—' },
    { source: 'parameters', key: 'ki', label: 'Ki', unit: '1/s' },
    { source: 'parameters', key: 'kd', label: 'Kd', unit: 's' },
    { source: 'parameters', key: 'loadTorque', label: 'TL', unit: 'N·m' },
    { source: 'parameters', key: 'vMax', label: 'Vmax', unit: 'V' },
  ],
  measurementColumns: M05_RESULT_COLUMNS,
  graph: {
    title: 'Recorded overshoot against amplifier gain',
    x: { source: 'parameters', key: 'kp', label: 'Kp', unit: '—' },
    y: { source: 'measurements', key: 'overshootPercent', label: 'Mp', unit: '%' },
  },
};
