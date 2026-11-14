import type { RecordedRow } from '@/features/reports';
import { cellValue, type ResultsColumn } from './cellValue';

export interface ResultsTableProps {
  readonly rows: readonly RecordedRow[];
  readonly columns: readonly ResultsColumn[];
  readonly caption: string;
}

/**
 * The student's results table (FR-08). Rows hold only values the simulation
 * produced when the student pressed Record; nothing here computes a value.
 */
export function ResultsTable({ rows, columns, caption }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-right text-sm tabular-nums">
        <caption className="mb-2 text-left text-navy-700">{caption}</caption>
        <thead>
          <tr className="border-b border-navy-200">
            <th scope="col" className="px-2 py-1 text-left font-medium text-navy-800">
              #
            </th>
            {columns.map((c) => (
              <th
                key={`${c.source}.${c.key}`}
                scope="col"
                className="px-2 py-1 font-medium text-navy-800"
              >
                {c.label} ({c.unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-2 py-3 text-left text-navy-600">
                No rows recorded yet.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-navy-100">
                <th scope="row" className="px-2 py-1 text-left font-normal text-navy-600">
                  {i + 1}
                </th>
                {columns.map((c) => (
                  <td key={`${c.source}.${c.key}`} className="px-2 py-1 text-navy-900">
                    {cellValue(row, c)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
