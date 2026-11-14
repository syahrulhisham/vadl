import type { RecordedRow } from '@/features/reports';
import { formatSignificant } from '@/sim-core';

export interface ResultsColumn {
  /** Where the value lives in a recorded row. */
  readonly source: 'time' | 'parameters' | 'measurements';
  /** Key inside `parameters` or `measurements`; ignored for `time`. */
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  /** Multiplier from SI to the display unit. Default 1. */
  readonly scale?: number;
  readonly significantFigures?: number;
}

/** Display value of one cell, or "—" when the row has no such value. */
export function cellValue(row: RecordedRow, column: ResultsColumn): string {
  const raw =
    column.source === 'time'
      ? row.time
      : column.source === 'parameters'
        ? row.parameters[column.key]
        : row.measurements[column.key];
  if (raw === undefined) return '—';
  return formatSignificant(raw * (column.scale ?? 1), column.significantFigures ?? 4);
}
