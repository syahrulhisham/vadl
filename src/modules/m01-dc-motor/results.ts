/** Results-table columns and recorded parameters for M01 (shared by the lab and the report). */
import type { ResultsColumn } from '@/features/recording';
import type { DcMotorParams } from '@/sim-core';

const DEG = 180 / Math.PI;

/** The numeric parameters of a run, in SI (angles in radians), for a recorded row. */
export function numericParameters(p: DcMotorParams): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number') out[k] = v;
  return out;
}

export const M01_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'time', key: 't', label: 't', unit: 's' },
  { source: 'measurements', key: 'armatureVoltage', label: 'Va', unit: 'V' },
  { source: 'parameters', key: 'alphaArmature', label: 'αa', unit: '°', scale: DEG },
  { source: 'measurements', key: 'fieldCurrent', label: 'If', unit: 'A' },
  { source: 'measurements', key: 'armatureCurrent', label: 'Ia', unit: 'A' },
  { source: 'measurements', key: 'backEmf', label: 'Eg', unit: 'V' },
  { source: 'measurements', key: 'speedRpm', label: 'n', unit: 'rpm' },
  { source: 'measurements', key: 'torque', label: 'Td', unit: 'N·m' },
  { source: 'measurements', key: 'loadTorque', label: 'TL', unit: 'N·m' },
  { source: 'measurements', key: 'inputPower', label: 'Pin', unit: 'W' },
  { source: 'measurements', key: 'outputPower', label: 'Pout', unit: 'W' },
  { source: 'measurements', key: 'efficiency', label: 'η', unit: '%', scale: 100 },
];
