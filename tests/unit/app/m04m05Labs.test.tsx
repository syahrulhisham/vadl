// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import {
  markCalculation,
  markSequence,
  QuestionCard,
  type SequenceQuestion,
} from '@/features/assessment';
import { M04_QUESTIONS } from '@/modules/m04-stepper/questions';
import { M05_QUESTIONS } from '@/modules/m05-servo/questions';
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

describe('M04 stepper laboratory', () => {
  it('fills the seven regions with the motor diagram, sequence table and questions', async () => {
    open('/modules/stepper-motors');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('stepper-diagram')).toBeInTheDocument();
    expect(screen.queryByText(/This region is filled when the laboratory is built/)).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(M04_QUESTIONS.length);
  });

  it('course lab motor at rest: Sa 30°, 3 phases, PPR 12, 100 rpm at 20 pulses/s; phase A lit', async () => {
    open('/modules/stepper-motors');
    await screen.findByTestId('stepper-diagram');
    expect(value('Full step angle')).toBe('30');
    expect(value('Phases')).toBe('3');
    expect(value('Pulses per revolution')).toBe('12');
    expect(value('Speed')).toBe('100');
    expect(value('Time per step')).toBe('0.05');
    expect(within(screen.getByTestId('phase-lights')).getByText(/A on/)).toBeInTheDocument();
    const rows = within(screen.getByTestId('sequence-table')).getAllByRole('row');
    expect(rows).toHaveLength(5); // header + 4 (A, B, C, A)
    expect(rows[1]).toHaveAttribute('aria-current', 'step');
  });

  it('rejects an invalid tooth combination with the course explanation', async () => {
    open('/modules/stepper-motors');
    await screen.findByTestId('stepper-diagram');
    // From the 6/4 motor, Nr = 8 gives Ns < Nr (the course caption slip, 4 stator / 6 rotor, is the same case).
    fireEvent.change(screen.getByRole('spinbutton', { name: /^Rotor teeth Nr/ }), {
      target: { value: '8' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/negative step angle/);
  });

  it('half step halves the angle; hybrid motor shows steps per revolution and coil drive', async () => {
    open('/modules/stepper-motors');
    await screen.findByTestId('stepper-diagram');
    fireEvent.change(screen.getByRole('combobox', { name: 'Drive mode' }), {
      target: { value: 'half' },
    });
    expect(value('Angle per pulse')).toBe('15');
    expect(value('Speed')).toBe('50');
    fireEvent.click(screen.getByRole('button', { name: 'Hybrid 1.8°' }));
    expect(value('Full step angle')).toBe('1.8');
    expect(screen.getByRole('spinbutton', { name: /^Full steps per revolution/ })).toHaveValue(200);
    expect(screen.getByRole('combobox', { name: 'Coil drive' })).toBeInTheDocument();
    expect(value('Speed')).toBe('150');
  });

  it('records a row', async () => {
    const repo = open('/modules/stepper-motors');
    await screen.findByTestId('stepper-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    expect(
      within(screen.getByRole('table', { name: /Recorded measurements/ })).getAllByRole('row'),
    ).toHaveLength(2);
    await new Promise((r) => setTimeout(r, 0));
    expect(
      (await repo.get<{ rows: unknown[] }[]>(sessionsKey('m04-stepper')))?.[0]?.rows,
    ).toHaveLength(1);
  });
});

describe('M05 servo laboratory', () => {
  it('fills the seven regions with the loop diagram, dial and questions', async () => {
    open('/modules/servo-motors');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.getByTestId('servo-diagram')).toBeInTheDocument();
    expect(screen.getByTestId('servo-dial')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(M05_QUESTIONS.length);
  });

  it('before starting: reference 90°, Vcs 1.571 V, Vfc 0, drive signal 1.571 V', async () => {
    open('/modules/servo-motors');
    await screen.findByTestId('servo-diagram');
    expect(value('Reference')).toBe('90');
    expect(value('Control signal')).toBe('1.571');
    expect(value('Feedback signal')).toBe('0');
    expect(value('Drive signal')).toBe('1.571');
    expect(value('Amplifier output')).toBe('7.854');
  });

  it('speed servo shows rpm values; Kd is position only', async () => {
    open('/modules/servo-motors');
    await screen.findByTestId('servo-diagram');
    expect(screen.getByRole('spinbutton', { name: /^Derivative gain Kd/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Servo type' }), {
      target: { value: 'speed' },
    });
    expect(value('Reference')).toBe('954.9');
    expect(screen.queryByRole('spinbutton', { name: /^Derivative gain Kd/ })).toBeNull();
    expect(within(screen.getByTestId('servo-diagram')).getByText('Tachometer')).toBeInTheDocument();
  });
});

describe('M04 and M05 question banks', () => {
  it.each([
    ['m04', M04_QUESTIONS],
    ['m05', M05_QUESTIONS],
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
            expect(Number.isFinite(inst.answer) && inst.answer > 0).toBe(true);
            expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
            expect(markCalculation(String(inst.answer), inst).correct).toBe(true);
          } else {
            const inst = q.generate(seed);
            expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
            const angles = inst.angles.map(String);
            expect(markSequence({ cells: inst.answer, angles }, inst).correct).toBe(true);
            const flipped = inst.answer.map((row, r) =>
              r === 1 ? row.map((v) => (v === 0 ? 1 : 0)) : row,
            );
            expect(markSequence({ cells: flipped, angles }, inst).feedback).toMatch(/step 2/);
          }
        }
      }
    },
  );

  it('pulse and count answers are exact integers', () => {
    for (const id of ['m04.calc.pulses-half', 'm05.calc.encoder-count', 'm05.calc.encoder-lines']) {
      const q = [...M04_QUESTIONS, ...M05_QUESTIONS].find((x) => x.id === id);
      if (q?.kind !== 'calculation') throw new Error(id);
      for (let seed = 0; seed < 50; seed += 1) {
        const inst = q.generate(seed);
        expect(Number.isInteger(Math.round(inst.answer * 1e9) / 1e9)).toBe(true);
        expect(markCalculation(String(Math.round(inst.answer) + 1), inst).correct).toBe(false);
      }
    }
  });
});

describe('sequence-table question card', () => {
  const q = M04_QUESTIONS.find((x) => x.kind === 'sequence') as SequenceQuestion;

  it('the student fills the table and gets row-level feedback, then the full answer', () => {
    const attempts: string[] = [];
    render(
      <QuestionCard
        question={q}
        number={1}
        initialSeed={3}
        onAttempt={(a) => attempts.push(a.answerGiven)}
      />,
    );
    const inst = q.generate(3);
    const check = screen.getByRole('button', { name: 'Check answer' });
    expect(check).toBeDisabled();
    inst.answer.forEach((row, r) => {
      row.forEach((v, j) => {
        fireEvent.change(
          screen.getByRole('combobox', { name: `Step ${r + 1}, phase ${inst.phaseLabels[j]}` }),
          { target: { value: String(v) } },
        );
      });
      fireEvent.change(
        screen.getByRole('textbox', { name: `Step ${r + 1}, rotor angle in degrees` }),
        {
          target: { value: String(r === 0 ? (inst.angles[0] ?? 0) + 3 : inst.angles[r]) },
        },
      );
    });
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent(/angle wrong \(±0.5°\) in step 1/);
    expect(screen.getByRole('status')).toHaveTextContent(/Step 1: A/);
    expect(JSON.parse(attempts[0] ?? '{}').cells).toEqual(inst.answer);
  });
});
