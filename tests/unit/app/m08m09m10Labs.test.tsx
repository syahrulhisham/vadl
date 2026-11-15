// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import { markCalculation } from '@/features/assessment';
import { M08_QUESTIONS } from '@/modules/m08-pneumatics/questions';
import { M09_QUESTIONS } from '@/modules/m09-electro-pneumatics/questions';
import { M10_QUESTIONS } from '@/modules/m10-electrohydraulics/questions';
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

describe('M08 pneumatics laboratory', () => {
  it('fills the seven regions; default circuit at 6 bar: theoretical 188.5 N, effective 156 N (RC-M08-01)', async () => {
    open('/modules/pneumatics');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('pneumatic-cylinder')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(M08_QUESTIONS.length);
    expect(value('Theoretical force p·A')).toBe('188.5');
    expect(value('Effective extend force')).toBe('156');
  });

  it('a held push button lights its signal; the AND circuit shows the double-pilot valve', async () => {
    open('/modules/pneumatics');
    await screen.findByTestId('signal-chain');
    const button = screen.getByRole('button', { name: '1S1' });
    fireEvent.pointerDown(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByTestId('signal-chain')).getByText('1S1')).toHaveAttribute(
      'data-on',
      'true',
    );
    fireEvent.pointerUp(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.change(screen.getByRole('combobox', { name: 'Lab 2 circuit' }), {
      target: { value: 'and-memory' },
    });
    expect(screen.getByText(/5\/2 double-pilot \(memory\)/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Flow control fitted as' })).toHaveValue(
      'meter-out',
    );
  });

  it('records a row', async () => {
    const repo = open('/modules/pneumatics');
    await screen.findByTestId('signal-chain');
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    await new Promise((r) => setTimeout(r, 0));
    expect(
      (await repo.get<{ rows: unknown[] }[]>(sessionsKey('m08-pneumatics')))?.[0]?.rows,
    ).toHaveLength(1);
  });
});

describe('M09 electro-pneumatics laboratory', () => {
  it('fills the seven regions with two cylinders, lamps and the ladder', async () => {
    open('/modules/electro-pneumatics');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('cylinder-1A1')).toBeInTheDocument();
    expect(screen.getByTestId('ladder-diagram')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(M09_QUESTIONS.length);
  });

  it('Part A: holding S1 lights 1M1 and S1 carries 0.5 A; Part B: S1 carries only the relay current', async () => {
    open('/modules/electro-pneumatics');
    await screen.findByTestId('ladder-diagram');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S1' }));
    expect(screen.getByTestId('lamp-1M1')).toHaveAttribute('data-on', 'true');
    expect(value('Current through S1')).toBe('0.5');
    fireEvent.pointerUp(screen.getByRole('button', { name: 'S1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Part B: indirect' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S1' }));
    expect(screen.getByTestId('lamp-K1')).toHaveAttribute('data-on', 'true');
    expect(value('Current through S1')).toBe('0.04138');
  });

  it('the ladder editor changes the circuit: adding an S2 contact makes an AND', async () => {
    open('/modules/electro-pneumatics');
    await screen.findByTestId('ladder-editor');
    const editor = screen.getByTestId('ladder-editor');
    fireEvent.click(within(editor).getByRole('button', { name: 'Add contact' }));
    fireEvent.change(within(editor).getByRole('combobox', { name: 'Rung 1 Branch 1 contact 2' }), {
      target: { value: 'S2|0' },
    });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S1' }));
    expect(screen.getByTestId('lamp-1M1')).toHaveAttribute('data-on', 'false');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S2' }));
    expect(screen.getByTestId('lamp-1M1')).toHaveAttribute('data-on', 'true');
  });

  it('hidden fault: inserted without showing it, diagnosis checked', async () => {
    open('/modules/electro-pneumatics');
    await screen.findByTestId('ladder-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Insert a hidden fault' }));
    expect(screen.getByTestId('hidden-fault-note')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Fault (shown)' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Check diagnosis' }));
    expect(screen.getByText(/Correct: that is the fault\.|Not this one/)).toBeInTheDocument();
  });
});

describe('M10 electrohydraulics laboratory', () => {
  it('fills the seven regions; Lab 4a Ex 2 at rest: load pressure 0.75 MPa, area ratio 1.641', async () => {
    open('/modules/electrohydraulics');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('hydraulic-chain')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(M10_QUESTIONS.length);
    expect(value('Load pressure F/A_PR')).toBe('0.7346');
    expect(value('Area ratio φ')).toBe('1.641');
  });

  it('Lab 4b circuits show push buttons and the ladder; the AND platform needs both buttons', async () => {
    open('/modules/electrohydraulics');
    await screen.findByTestId('hydraulic-chain');
    fireEvent.change(screen.getByRole('combobox', { name: 'Lab circuit' }), {
      target: { value: '4b-ex2b' },
    });
    expect(screen.getByTestId('ladder-diagram')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S1' }));
    expect(screen.getByTestId('lamp-1M1')).toHaveAttribute('data-on', 'false');
    fireEvent.pointerDown(screen.getByRole('button', { name: 'S2' }));
    expect(screen.getByTestId('lamp-1M1')).toHaveAttribute('data-on', 'true');
  });
});

describe('M08–M10 question banks', () => {
  it.each([
    ['m08', M08_QUESTIONS],
    ['m09', M09_QUESTIONS],
    ['m10', M10_QUESTIONS],
  ] as const)('%s: unique ids, all levels, answers that mark correct for 200 seeds', (_n, bank) => {
    expect(new Set(bank.map((q) => q.id)).size).toBe(bank.length);
    expect(new Set(bank.map((q) => q.level))).toEqual(
      new Set(['beginner', 'intermediate', 'advanced']),
    );
    for (const q of bank) {
      if ('choices' in q) {
        expect(q.choices.some((c) => c.id === q.correctChoiceId)).toBe(true);
        for (const c of q.choices)
          if (c.id !== q.correctChoiceId) expect(c.explanationIfChosen).toBeTruthy();
        continue;
      }
      if (q.kind !== 'calculation') continue;
      expect(q.generate(9)).toEqual(q.generate(9));
      for (let seed = 0; seed < 200; seed += 1) {
        const inst = q.generate(seed);
        expect(Number.isFinite(inst.answer) && inst.answer > 0).toBe(true);
        expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
        expect(markCalculation(String(inst.answer), inst).correct).toBe(true);
      }
    }
  });
});
