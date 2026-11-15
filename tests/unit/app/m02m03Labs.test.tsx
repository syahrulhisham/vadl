// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import { M02_QUESTIONS } from '@/modules/m02-ac-motor/questions';
import { M03_QUESTIONS } from '@/modules/m03-power-converters/questions';
import { markCalculation } from '@/features/assessment';
import {
  createLocalStorageRepository,
  createMemoryStorage,
  RepositoryProvider,
  sessionsKey,
} from '@/storage';

function open(path: string) {
  const repo = createLocalStorageRepository(createMemoryStorage());
  render(
    <RepositoryProvider repository={repo}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </RepositoryProvider>,
  );
  return repo;
}

const value = (name: string) =>
  within(screen.getByRole('group', { name, exact: true } as never)).getByTestId('measurement-value')
    .textContent;

describe('M02 AC motor laboratory', () => {
  it('fills the seven regions with the field view, theory and questions', async () => {
    open('/modules/ac-motor-drives');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('ac-field-view')).toBeInTheDocument();
    expect(screen.queryByText(/This region is filled when the laboratory is built/)).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(M02_QUESTIONS.length);
  });

  it('shows circuit values at standstill: Ns 1800 rpm, slip 100 %, Tst 82.96 N·m, Tmax 265.6 N·m', async () => {
    open('/modules/ac-motor-drives');
    await screen.findByTestId('ac-field-view');
    expect(value('Synchronous speed')).toBe('1800');
    expect(value('Slip')).toBe('100');
    expect(value('Starting torque')).toBe('82.96');
    expect(value('Maximum torque')).toBe('265.6');
  });

  it('control method shows its own knob; V/f at 30 Hz halves Ns', async () => {
    open('/modules/ac-motor-drives');
    await screen.findByTestId('ac-field-view');
    expect(screen.queryByLabelText(/Voltage factor b \(—\)/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'V/f' }));
    expect(screen.getByLabelText(/Supply frequency f \(Hz\)/)).toHaveValue(30);
    expect(value('Synchronous speed')).toBe('900');
    fireEvent.click(screen.getByRole('button', { name: 'Stator voltage' }));
    expect(screen.getByLabelText(/Voltage factor b \(—\)/)).toBeInTheDocument();
  });

  it('records a row', async () => {
    const repo = open('/modules/ac-motor-drives');
    await screen.findByTestId('ac-field-view');
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    expect(
      within(screen.getByRole('table', { name: /Recorded measurements/ })).getAllByRole('row'),
    ).toHaveLength(2);
    await new Promise((r) => setTimeout(r, 0));
    expect(
      (await repo.get<{ rows: unknown[] }[]>(sessionsKey('m02-ac-motor')))?.[0]?.rows,
    ).toHaveLength(1);
  });
});

describe('M03 power converter laboratory', () => {
  it('fills the seven regions; default is Lab 1 half-wave thyristor at 240 V, α 30°: Vavg 100.8 V', async () => {
    open('/modules/power-converters');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('converter-diagram')).toBeInTheDocument();
    expect(value('Average output voltage')).toBe('100.8');
    expect(value('RMS output voltage')).toBe('167.2');
  });

  it('Lab 1 buttons set supply and firing angle: bridge at 120 V, α 90° → Vavg 54.02 V', async () => {
    open('/modules/power-converters');
    await screen.findByTestId('converter-diagram');
    fireEvent.change(screen.getByRole('combobox', { name: 'Circuit' }), {
      target: { value: 'thyristor-bridge-r' },
    });
    fireEvent.click(screen.getByRole('button', { name: '120 V' }));
    fireEvent.click(screen.getByRole('button', { name: '90°' }));
    expect(value('Average output voltage')).toBe('54.02');
  });

  it('switching family shows the matching readouts and warns in discontinuous conduction', async () => {
    open('/modules/power-converters');
    await screen.findByTestId('converter-diagram');
    fireEvent.change(screen.getByRole('combobox', { name: 'Converter type' }), {
      target: { value: 'dcdc' },
    });
    expect(value('Average output voltage')).toBe('19.2');
    expect(value('Inductor ripple ΔI')).toBe('0.576');
    expect(screen.getByText(/Continuous conduction: the formulas apply/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Inductance L \(µH\)/), { target: { value: '100' } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Discontinuous conduction: L is below Lmin = 150 µH/,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Converter type' }), {
      target: { value: 'inverter' },
    });
    expect(value('Fundamental, formula')).toBe('113.1');
  });
});

describe('M02 and M03 question banks', () => {
  it.each([
    ['m02', M02_QUESTIONS],
    ['m03', M03_QUESTIONS],
  ] as const)(
    '%s: unique ids, all levels, reproducible physical calculation answers',
    (_name, bank) => {
      expect(new Set(bank.map((q) => q.id)).size).toBe(bank.length);
      expect(new Set(bank.map((q) => q.level))).toEqual(
        new Set(['beginner', 'intermediate', 'advanced']),
      );
      for (const q of bank) {
        if (q.kind === 'sequence') continue;
        if (q.kind !== 'calculation') {
          expect(q.choices.some((c) => c.id === q.correctChoiceId)).toBe(true);
          for (const c of q.choices)
            if (c.id !== q.correctChoiceId) expect(c.explanationIfChosen).toBeTruthy();
          continue;
        }
        expect(q.generate(9)).toEqual(q.generate(9));
        for (let seed = 0; seed < 200; seed += 1) {
          const inst = q.generate(seed);
          expect(Number.isFinite(inst.answer) && inst.answer > 0).toBe(true);
          expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
          expect(markCalculation(String(inst.answer), inst).correct).toBe(true);
        }
      }
    },
  );
});
