/** Results-table columns, recorded parameters, wheel naming and report definition for M06. */
import type { ResultsColumn } from '@/features/recording';
import type { ReportDefinition } from '@/features/reports/definition';
import { transmissionModel, type TransmissionParams } from '@/sim-core';
import { M06_OUTCOMES, M06_THEORY } from './content.en';

/** Numeric record of the parameters, with each stage flattened (stage1Driver, …). */
export function numericParameters(p: TransmissionParams): Record<string, number> {
  const out: Record<string, number> = {
    inputSpeed: p.inputSpeed,
    inputDirection: p.inputDirection,
    inputTorque: p.inputTorque,
    stages: p.stages.length,
    beltTight: p.beltTight,
    beltSlack: p.beltSlack,
    beltDriverRadius: p.beltDriverRadius,
    beltDrivenRadius: p.beltDrivenRadius,
    liftSupports: p.liftSupports,
    liftLoad: p.liftLoad,
    liftHeight: p.liftHeight,
    liftEfficiency: p.liftEfficiency,
  };
  p.stages.forEach((s, i) => {
    out[`stage${i + 1}Driver`] = s.driver;
    out[`stage${i + 1}Driven`] = s.driven;
    out[`stage${i + 1}Idler`] = s.idler;
  });
  return out;
}

export interface Wheel {
  readonly letter: string;
  readonly role: 'driver' | 'idler' | 'driven';
  readonly stage: number;
  /** Teeth, or diameter [m] for belt pulleys. */
  readonly size: number;
  /** Index of its shaft in the model outputs (`speed{k}`), or −1 for an idler. */
  readonly shaft: number;
}

/** Wheels lettered A, B, C … in drive order, as in the course figures. */
export function wheelsOf(p: TransmissionParams): Wheel[] {
  const wheels: Wheel[] = [];
  const letter = () => String.fromCharCode(65 + wheels.length);
  p.stages.forEach((s, i) => {
    wheels.push({ letter: letter(), role: 'driver', stage: i, size: s.driver, shaft: i });
    if (s.kind === 'gear' && s.idler > 0) {
      wheels.push({ letter: letter(), role: 'idler', stage: i, size: s.idler, shaft: -1 });
    }
    wheels.push({ letter: letter(), role: 'driven', stage: i, size: s.driven, shaft: i + 1 });
  });
  return wheels;
}

export const M06_RESULT_COLUMNS: readonly ResultsColumn[] = [
  { source: 'parameters', key: 'stages', label: 'stages', unit: '—' },
  { source: 'measurements', key: 'speedRpm0', label: 'N in', unit: 'rpm' },
  { source: 'measurements', key: 'overallRatio', label: 'G', unit: '—' },
  { source: 'measurements', key: 'outputSpeedRpm', label: 'N out (+CW)', unit: 'rpm' },
  { source: 'measurements', key: 'outputTorque', label: 'T out', unit: 'N·m' },
  { source: 'measurements', key: 'beltPower', label: 'P belt', unit: 'W' },
  { source: 'measurements', key: 'liftMA', label: 'MA', unit: '—' },
  { source: 'measurements', key: 'liftEffort', label: 'effort', unit: 'N' },
  { source: 'measurements', key: 'liftEffortDistance', label: 'effort dist.', unit: 'm' },
];

export const M06_REPORT: ReportDefinition = {
  moduleId: 'm06-transmission',
  title: 'BELK 3423 Virtual Laboratory — Mechanical Transmission',
  objectives: M06_OUTCOMES.map((o) => `${o.text} (${o.courseLo})`),
  equations: [M06_THEORY.convention, ...M06_THEORY.equations, ...M06_THEORY.extension],
  assumptions: transmissionModel.assumptions,
  parameterColumns: [
    { source: 'parameters', key: 'stage1Driver', label: 'stage 1 driver', unit: 'T or m' },
    { source: 'parameters', key: 'stage1Driven', label: 'stage 1 driven', unit: 'T or m' },
    { source: 'parameters', key: 'stage2Driver', label: 'stage 2 driver', unit: 'T or m' },
    { source: 'parameters', key: 'stage2Driven', label: 'stage 2 driven', unit: 'T or m' },
    { source: 'parameters', key: 'inputTorque', label: 'T in', unit: 'N·m' },
    { source: 'parameters', key: 'liftSupports', label: 'n', unit: '—' },
    { source: 'parameters', key: 'liftLoad', label: 'load', unit: 'N' },
  ],
  measurementColumns: M06_RESULT_COLUMNS,
  graph: {
    title: 'Recorded output speed against overall ratio',
    x: { source: 'measurements', key: 'overallRatio', label: 'G', unit: '—' },
    y: { source: 'measurements', key: 'outputSpeedRpm', label: 'N out', unit: 'rpm' },
  },
};
