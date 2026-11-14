/** M01 report definition: what the DC motor laboratory report contains. */
import type { ReportDefinition } from '@/features/reports/definition';
import { dcMotorModel } from '@/sim-core';
import { M01_OUTCOMES, M01_THEORY } from './content.en';
import { M01_RESULT_COLUMNS } from './results';

const DEG = 180 / Math.PI;

export const M01_REPORT: ReportDefinition = {
  moduleId: 'm01-dc-motor',
  title: 'BELK 3423 Virtual Laboratory — DC Motor Drives',
  objectives: M01_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [...M01_THEORY.equations, ...M01_THEORY.converters],
  assumptions: dcMotorModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'armatureVoltage', label: 'Va set (DC supply)', unit: 'V' },
    { source: 'parameters', key: 'fieldVoltage', label: 'Vf set', unit: 'V' },
    { source: 'parameters', key: 'supplyRms', label: 'Vs (converter)', unit: 'V' },
    { source: 'parameters', key: 'alphaArmature', label: 'αa', unit: '°', scale: DEG },
    { source: 'parameters', key: 'alphaField', label: 'αf', unit: '°', scale: DEG },
    { source: 'parameters', key: 'ra', label: 'Ra', unit: 'Ω' },
    { source: 'parameters', key: 'rst', label: 'Rst', unit: 'Ω' },
    { source: 'parameters', key: 'kv', label: 'Kv', unit: 'V/(A·rad/s)' },
    { source: 'parameters', key: 'loadRatedTorque', label: 'Tr', unit: 'N·m' },
    { source: 'parameters', key: 'loadExponent', label: 'k', unit: '—' },
  ],
  measurementColumns: M01_RESULT_COLUMNS,
  graph: {
    title: 'Recorded operating points: speed against developed torque',
    x: { source: 'measurements', key: 'torque', label: 'Td', unit: 'N·m' },
    y: { source: 'measurements', key: 'speedRpm', label: 'n', unit: 'rpm' },
  },
};
