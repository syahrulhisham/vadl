// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartFigure, pickRows, sampleCurve, timeUnitFor, toTimeRows } from '@/features/graphs';
import { cellValue, ResultsTable, type ResultsColumn } from '@/features/recording';
import type { RecordedRow } from '@/features/reports';
import type { Sample } from '@/sim-core';

const samples: Sample[] = Array.from({ length: 2000 }, (_, i) => ({
  t: i * 0.001,
  values: { current: i / 2000 },
}));

describe('chart data preparation', () => {
  it('converts SI samples to display rows with time and value scaling', () => {
    const rows = toTimeRows(
      samples.slice(0, 3),
      [{ key: 'current', label: 'i', unit: 'mA', scale: 1000, color: '#000' }],
      1000,
    );
    expect(rows).toEqual([
      { t: 0, current: 0 },
      { t: 1, current: 0.5 },
      { t: 2, current: 1 },
    ]);
  });

  it('downsamples long traces to at most the requested number of points', () => {
    const rows = toTimeRows(
      samples,
      [{ key: 'current', label: 'i', unit: 'A', color: '#000' }],
      1,
      100,
    );
    expect(rows.length).toBeLessThanOrEqual(100);
    expect(rows[0]?.t).toBe(0);
    expect(rows.at(-1)?.t).toBeCloseTo(1.999, 9);
  });

  it('returns no rows without a series and skips missing keys', () => {
    expect(toTimeRows(samples, [], 1)).toEqual([]);
    const rows = toTimeRows(
      samples.slice(0, 1),
      [{ key: 'missing', label: 'x', unit: 'A', color: '#000' }],
      1,
    );
    expect(rows).toEqual([{ t: 0 }]);
  });

  it('chooses ms below one second and s above', () => {
    expect(timeUnitFor(0.05)).toEqual({ unit: 'ms', scale: 1000 });
    expect(timeUnitFor(5)).toEqual({ unit: 's', scale: 1 });
  });

  it('samples a curve evenly including both ends', () => {
    const c = sampleCurve((x) => 2 * x, 0, 1, 5);
    expect(c.map((p) => p.x)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(c[4]?.y).toBe(2);
    expect(() => sampleCurve((x) => x, 0, 1, 1)).toThrow(RangeError);
  });

  it('picks evenly spaced table rows keeping first and last', () => {
    expect(pickRows([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual([1, 5, 9]);
    expect(pickRows([1, 2], 5)).toEqual([1, 2]);
    expect(() => pickRows([1], 1)).toThrow(RangeError);
  });
});

describe('ChartFigure (NFR-10)', () => {
  it('gives the chart a name, a description and an expandable data table', () => {
    render(
      <ChartFigure
        title="Current against time"
        description="Current rising to 1 A"
        columns={[
          { key: 't', label: 't (ms)' },
          { key: 'current', label: 'i (A)' },
        ]}
        rows={[
          { t: 0, current: 0 },
          { t: 10, current: 0.632121 },
        ]}
      >
        <svg />
      </ChartFigure>,
    );
    expect(screen.getByRole('img', { name: 'Current against time' })).toHaveAccessibleDescription(
      'Current rising to 1 A',
    );
    fireEvent.click(screen.getByText('Show data table'));
    expect(screen.getByRole('cell', { name: '0.6321' })).toBeInTheDocument();
  });

  it('says so when there is no data', () => {
    render(
      <ChartFigure title="Empty" description="none" columns={[]} rows={[]}>
        <svg />
      </ChartFigure>,
    );
    expect(screen.getByText('No data yet.')).toBeInTheDocument();
  });
});

describe('ResultsTable (FR-08)', () => {
  const row: RecordedRow = {
    time: 0.01,
    parameters: { voltage: 10 },
    measurements: { current: 0.6321206, fractionOfFinal: 0.6321206 },
  };
  const columns: ResultsColumn[] = [
    { source: 'time', key: 't', label: 'Time', unit: 'ms', scale: 1000 },
    { source: 'parameters', key: 'voltage', label: 'V', unit: 'V' },
    { source: 'measurements', key: 'current', label: 'i', unit: 'A' },
    { source: 'measurements', key: 'fractionOfFinal', label: 'i/I∞', unit: '%', scale: 100 },
    { source: 'measurements', key: 'absent', label: 'x', unit: '-' },
  ];

  it('formats recorded values in display units and shows a dash for missing ones', () => {
    expect(columns.map((c) => cellValue(row, c))).toEqual(['10', '10', '0.6321', '63.21', '—']);
  });

  it('renders one row per recording, and an empty message before any', () => {
    const { rerender } = render(<ResultsTable rows={[]} columns={columns} caption="Results" />);
    expect(screen.getByText('No rows recorded yet.')).toBeInTheDocument();
    rerender(<ResultsTable rows={[row, row]} columns={columns} caption="Results" />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('columnheader', { name: 'i/I∞ (%)' })).toBeInTheDocument();
  });
});
