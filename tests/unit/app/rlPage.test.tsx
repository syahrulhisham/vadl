// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';

async function open() {
  render(
    <MemoryRouter initialEntries={['/resources/rl-circuit']}>
      <AppRoutes />
    </MemoryRouter>,
  );
  // The first load imports the chart library, which takes longer than the 1 s default.
  await screen.findByRole(
    'heading',
    { level: 1, name: 'First-order RL circuit' },
    { timeout: 10_000 },
  );
}

describe('RL circuit worked example page', () => {
  it('is linked from Learning resources', async () => {
    render(
      <MemoryRouter initialEntries={['/resources']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const link = await screen.findByRole('link', { name: /First-order RL circuit/ });
    expect(link).toHaveAttribute('href', '/resources/rl-circuit');
  });

  it('fills six of the seven regions; assessment remains a placeholder', async () => {
    await open();
    const shell = screen.getByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getAllByText(/This region is filled when the laboratory is built/)).toHaveLength(
      1,
    );
    expect(screen.getByTestId('rl-diagram')).toBeInTheDocument();
    expect(screen.getByText('Kirchhoff voltage law: V = R·i + L·di/dt')).toBeInTheDocument();
  });

  it('shows the model values before the run: i = 0, τ = 10 ms, I∞ = 1 A', async () => {
    await open();
    const value = (name: string) =>
      within(screen.getByRole('group', { name })).getByTestId('measurement-value').textContent;
    expect(value('Current')).toBe('0');
    expect(value('Time constant')).toBe('10');
    expect(value('Final current')).toBe('1');
    expect(screen.getByText(/Δt = τ\/10 = 1 ms/)).toBeInTheDocument();
  });

  it('recalculates τ when L changes and rejects an out-of-range value with an explanation', async () => {
    await open();
    const box = screen.getByLabelText(/Inductance L \(H\)/);
    fireEvent.change(box, { target: { value: '0.2' } });
    expect(
      within(screen.getByRole('group', { name: 'Time constant' })).getByTestId('measurement-value'),
    ).toHaveTextContent('20');
    fireEvent.change(box, { target: { value: '50' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a value from 0.001 to 10 H.');
  });

  it('start locks the parameters; reset unlocks them', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByTestId('run-status')).toHaveTextContent('Running');
    expect(screen.getByLabelText(/Supply voltage V \(V\)/)).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Numerical method' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByTestId('run-status')).toHaveTextContent('Paused');
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('run-status')).toHaveTextContent('Ready');
    expect(screen.getByLabelText(/Supply voltage V \(V\)/)).toBeEnabled();
  });

  it('Record adds a row of simulated values; Clear empties the table', async () => {
    await open();
    expect(screen.getByText('No rows recorded yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    const table = screen.getByRole('table', { name: /Recorded measurements/ });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Clear table' }));
    expect(screen.getByText('No rows recorded yet.')).toBeInTheDocument();
  });
});
