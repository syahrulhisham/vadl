// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import {
  markCalculation,
  markTable,
  QuestionCard,
  type TableQuestion,
} from '@/features/assessment';
import { M06_QUESTIONS } from '@/modules/m06-transmission/questions';
import { wheelsOf } from '@/modules/m06-transmission/results';
import { M07_QUESTIONS } from '@/modules/m07-cam-follower/questions';
import { TRANSMISSION_PRESETS } from '@/sim-core';
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

describe('M06 transmission laboratory', () => {
  it('fills the seven regions with the train diagram and questions', async () => {
    open('/modules/mechanical-transmission');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('train-diagram')).toBeInTheDocument();
    expect(screen.queryByText(/This region is filled when the laboratory is built/)).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(M06_QUESTIONS.length);
  });

  it('example 1 at rest: G 0.5, B at 240 rpm anticlockwise', async () => {
    open('/modules/mechanical-transmission');
    await screen.findByTestId('train-diagram');
    expect(value('Overall ratio G')).toBe('0.5');
    expect(value('Output speed')).toBe('240');
    const rows = within(screen.getByTestId('wheel-table')).getAllByRole('row');
    expect(rows[2]).toHaveTextContent(/B\s*30T\s*240\s*Anticlockwise/);
  });

  it('idler example: C at 114.3 rpm clockwise, idler 342.9 rpm; compound example 360 rpm', async () => {
    open('/modules/mechanical-transmission');
    await screen.findByTestId('train-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Idler (Tutorial 4 Q4)' }));
    const rows = within(screen.getByTestId('wheel-table')).getAllByRole('row');
    expect(rows[2]).toHaveTextContent(/B \(idler\)\s*28T\s*342.9\s*Anticlockwise/);
    expect(rows[3]).toHaveTextContent(/C\s*84T\s*114.3\s*Clockwise/);
    fireEvent.click(screen.getByRole('button', { name: 'Compound train' }));
    expect(value('Output speed')).toBe('360');
    expect(value('Overall ratio G')).toBe('0.08333');
  });

  it('belt and lifting-pulley views show their own readings', async () => {
    open('/modules/mechanical-transmission');
    await screen.findByTestId('train-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Belt tensions' }));
    expect(screen.getByTestId('belt-diagram')).toBeInTheDocument();
    expect(value('Torque on driver pulley')).toBe('30');
    expect(value('Torque on driven pulley')).toBe('75');
    fireEvent.click(screen.getByRole('button', { name: 'Lifting pulleys' }));
    expect(screen.getByTestId('lift-diagram')).toBeInTheDocument();
    expect(value('Effort')).toBe('25');
    expect(value('Mechanical advantage')).toBe('4');
    expect(value('Effort distance')).toBe('4');
  });

  it('switching a stage to a crossed belt changes units and keeps a valid train; records a row', async () => {
    const repo = open('/modules/mechanical-transmission');
    await screen.findByTestId('train-diagram');
    fireEvent.change(screen.getByRole('combobox', { name: 'Drive (stage 1)' }), {
      target: { value: 'belt-crossed' },
    });
    expect(
      screen.getByRole('spinbutton', { name: /^Driver pulley diameter \(stage 1\)/ }),
    ).toHaveValue(100);
    expect(value('Output speed')).toBe('60');
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    await new Promise((r) => setTimeout(r, 0));
    expect(
      (await repo.get<{ rows: unknown[] }[]>(sessionsKey('m06-transmission')))?.[0]?.rows,
    ).toHaveLength(1);
  });

  it('letters wheels in drive order, with the idler included', () => {
    expect(wheelsOf(TRANSMISSION_PRESETS.idler).map((w) => w.letter + w.role)).toEqual([
      'Adriver',
      'Bidler',
      'Cdriven',
    ]);
    expect(wheelsOf(TRANSMISSION_PRESETS.beltTrain).map((w) => w.letter)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
    ]);
  });
});

describe('M07 cam laboratory', () => {
  it('fills the seven regions with the cam diagram, table and questions', async () => {
    open('/modules/cam-and-follower');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('cam-diagram')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(M07_QUESTIONS.length);
  });

  it('course example table at 30°: 0, 5, 10 … 30 … 0 mm; 45° steps give 9 rows', async () => {
    open('/modules/cam-and-follower');
    await screen.findByTestId('cam-diagram');
    const cells = within(screen.getByTestId('displacement-table'))
      .getAllByRole('cell')
      .map((c) => c.textContent);
    expect(cells).toEqual([
      '0',
      '5',
      '10',
      '15',
      '20',
      '25',
      '30',
      '25',
      '20',
      '15',
      '10',
      '5',
      '0',
    ]);
    fireEvent.change(screen.getByRole('combobox', { name: 'Table step' }), {
      target: { value: '45' },
    });
    expect(within(screen.getByTestId('displacement-table')).getAllByRole('cell')).toHaveLength(9);
  });

  it('follower choice changes the readings; a programme over 360° is rejected', async () => {
    open('/modules/cam-and-follower');
    await screen.findByTestId('cam-diagram');
    // θ = 0, knife-edge: tan φ = (30/π mm/rad)/(40 mm) → 13.43°
    expect(value('Pressure angle')).toBe('13.43');
    fireEvent.change(screen.getByRole('combobox', { name: 'Follower' }), {
      target: { value: 'flat' },
    });
    expect(
      screen.queryByRole('group', { name: 'Pressure angle', exact: true } as never),
    ).toBeNull();
    fireEvent.change(screen.getByRole('spinbutton', { name: /^Dwell angle/ }), {
      target: { value: '30' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot exceed 360°/);
  });
});

describe('M06 and M07 question banks', () => {
  it.each([
    ['m06', M06_QUESTIONS],
    ['m07', M07_QUESTIONS],
  ] as const)(
    '%s: unique ids, all levels, reproducible answers that mark correct',
    (_name, bank) => {
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
        expect(q.generate(9)).toEqual(q.generate(9));
        for (let seed = 0; seed < 200; seed += 1) {
          if (q.kind === 'calculation') {
            const inst = q.generate(seed);
            expect(Number.isFinite(inst.answer)).toBe(true);
            expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
            expect(markCalculation(String(inst.answer), inst).correct).toBe(true);
          } else if (q.kind === 'table') {
            const inst = q.generate(seed);
            expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
            expect(
              markTable(
                inst.rows.map((r) => String(r.answer)),
                inst,
              ).correct,
            ).toBe(true);
          }
        }
      }
    },
  );

  it('the compound-train answer carries the direction as its sign', () => {
    const q = M06_QUESTIONS.find((x) => x.id === 'm06.calc.compound');
    if (q?.kind !== 'calculation') throw new Error('missing');
    for (let seed = 0; seed < 50; seed += 1) {
      const inst = q.generate(seed);
      // Two external meshes: D turns the same way as A.
      expect(Math.sign(inst.answer)).toBe(/rpm clockwise/.test(inst.stem) ? 1 : -1);
      expect(markCalculation(String(-inst.answer), inst).feedback).toMatch(/Check the sign/);
    }
  });
});

describe('numeric-table question card', () => {
  const q = M07_QUESTIONS.find((x) => x.kind === 'table') as TableQuestion;

  it('marks each row and names the wrong ones', () => {
    const answers: string[] = [];
    render(
      <QuestionCard
        question={q}
        number={1}
        initialSeed={5}
        onAttempt={(a) => answers.push(a.answerGiven)}
      />,
    );
    const inst = q.generate(5);
    const check = screen.getByRole('button', { name: 'Check answer' });
    expect(check).toBeDisabled();
    inst.rows.forEach((r, i) => {
      fireEvent.change(screen.getByRole('textbox', { name: `${r.key}: Displacement (mm)` }), {
        target: { value: String(i === 2 ? r.answer + 5 : r.answer) },
      });
    });
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent(`check the value at ${inst.rows[2]?.key}`);
    expect(JSON.parse(answers[0] ?? '[]')).toHaveLength(inst.rows.length);
  });
});
