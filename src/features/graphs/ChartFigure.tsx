import { useId, type ReactNode } from 'react';
import { formatSignificant } from '@/sim-core';
import { pickRows } from './pickRows';

export interface TableColumn {
  readonly key: string;
  readonly label: string;
}

export interface ChartFigureProps {
  readonly title: string;
  /** Text alternative describing what the chart shows (NFR-10). */
  readonly description: string;
  readonly columns: readonly TableColumn[];
  readonly rows: readonly Readonly<Record<string, number>>[];
  /** Rows shown in the data table; the table is a summary, not the full trace. */
  readonly maxTableRows?: number;
  readonly children: ReactNode;
  readonly testId?: string;
}

/**
 * Wraps a chart in a <figure> with a caption, a text description for screen
 * readers, and an expandable data table so the values are available without
 * reading the graph (NFR-10).
 */
export function ChartFigure({
  title,
  description,
  columns,
  rows,
  maxTableRows = 12,
  children,
  testId,
}: ChartFigureProps) {
  const descId = useId();
  const tableRows = pickRows(rows, maxTableRows);
  return (
    <figure className="space-y-2" data-testid={testId}>
      <figcaption className="font-medium text-navy-800">{title}</figcaption>
      <p id={descId} className="sr-only">
        {description}
      </p>
      <div role="img" aria-describedby={descId} aria-label={title} className="w-full">
        {children}
      </div>
      <details className="text-sm">
        <summary className="min-h-touch cursor-pointer py-2 text-navy-700">Show data table</summary>
        {tableRows.length === 0 ? (
          <p className="text-navy-600">No data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-right tabular-nums">
              <thead>
                <tr className="border-b border-navy-200">
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className="px-2 py-1 font-medium text-navy-800">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-navy-100">
                    {columns.map((c) => (
                      <td key={c.key} className="px-2 py-1 text-navy-900">
                        {row[c.key] === undefined
                          ? '—'
                          : formatSignificant(row[c.key] as number, 4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </figure>
  );
}
