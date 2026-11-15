/** Results-table columns, recorded parameters and report definition for M04. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { stepperMotorModel, type StepperParams } from '@/sim-core';
import { M04_OUTCOMES, M04_THEORY } from './content.en';

const DEG = 180 / Math.PI;

export function numericParameters(p: StepperParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  out.direction = p.direction === 'cw' ? 1 : -1;
  out.rotorDynamics = p.rotorDynamics ? 1 : 0;
  return out;
}

export const M04_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'time', key: 't', label: 't', unit: 's' },
  { source: 'measurements', key: 'fullStepAngle', label: 'Sa', unit: '°', scale: DEG },
  { source: 'measurements', key: 'stepAngle', label: 'per pulse', unit: '°', scale: DEG },
  { source: 'measurements', key: 'ppr', label: 'PPR', unit: '—' },
  { source: 'measurements', key: 'pulseRate', label: 'PR', unit: 'pulses/s' },
  { source: 'measurements', key: 'stepTime', label: '1/PR', unit: 's' },
  { source: 'measurements', key: 'commandSpeedRpm', label: 'N', unit: 'rpm' },
  { source: 'measurements', key: 'pulses', label: 'pulses', unit: '—' },
  { source: 'measurements', key: 'rotorAngleDeg', label: 'θ', unit: '°' },
  { source: 'measurements', key: 'lostSteps', label: 'lost', unit: 'steps' },
];

export const M04_REPORT: ReportDefinition = {
  moduleId: 'm04-stepper',
  title: 'BELK 3423 Virtual Laboratory — Stepper Motors',
  objectives: M04_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M04_THEORY.equations, ...M04_THEORY.drives],
  assumptions: stepperMotorModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'statorTeeth', label: 'Ns', unit: '—' },
    { source: 'parameters', key: 'rotorTeeth', label: 'Nr', unit: '—' },
    { source: 'parameters', key: 'stepsPerRev', label: 'steps/rev', unit: '—' },
    { source: 'parameters', key: 'pulseRate', label: 'PR', unit: 'pulses/s' },
    { source: 'parameters', key: 'pulseLimit', label: 'pulses', unit: '—' },
    { source: 'parameters', key: 'direction', label: 'dir (+1 CW)', unit: '—' },
    { source: 'parameters', key: 'loadTorque', label: 'TL', unit: 'N·m' },
  ],
  measurementColumns: M04_RESULT_COLUMNS,
  graph: {
    title: 'Recorded speed against pulse rate',
    x: { source: 'measurements', key: 'pulseRate', label: 'PR', unit: 'pulses/s' },
    y: { source: 'measurements', key: 'commandSpeedRpm', label: 'N', unit: 'rpm' },
  },
};
