// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import {
  QuestionCard,
  type Attempt,
  type ChainQuestion,
  type ExplanationQuestion,
} from '@/features/assessment';
import { M01_QUESTIONS } from '@/modules/m01-dc-motor/questions';
import {
  attemptsKey,
  createLocalStorageRepository,
  createMemoryStorage,
  PROGRESS_KEY,
  reportKey,
  RepositoryProvider,
  sessionsKey,
  type Repository,
} from '@/storage';

function open(
  path: string,
  repo: Repository = createLocalStorageRepository(createMemoryStorage()),
) {
  render(
    <RepositoryProvider repository={repo}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </RepositoryProvider>,
  );
  return repo;
}

const attempt = (questionId: string, correct: boolean, extra: Partial<Attempt> = {}): Attempt => ({
  questionId,
  seed: null,
  answerGiven: 'a',
  correct,
  answeredAt: '2026-11-15T10:00:00.000Z',
  ...extra,
});

describe('assessment centre', () => {
  it('shows the ten question banks', async () => {
    open('/assessment');
    const table = await screen.findByTestId('bank-table');
    expect(within(table).getAllByRole('row')).toHaveLength(11);
    expect(within(table).getByText(/1\. DC Motor Drives/)).toBeInTheDocument();
  });

  it('a set code reproduces the same practice set; an answer is saved to its laboratory', async () => {
    const repo = open('/assessment');
    await screen.findByTestId('bank-table');
    fireEvent.change(screen.getByRole('textbox', { name: 'Set code (optional)' }), {
      target: { value: '4242' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Number of questions' }), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create practice set' }));
    const set = screen.getByTestId('practice-set');
    const first = within(set)
      .getAllByRole('article')
      .map((a) => a.getAttribute('data-question-id'));
    expect(first).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Create practice set' }));
    expect(
      within(screen.getByTestId('practice-set'))
        .getAllByRole('article')
        .map((a) => a.getAttribute('data-question-id')),
    ).toEqual(first);
    // Answer the first multiple-choice question in the set.
    const card = within(screen.getByTestId('practice-set'))
      .getAllByRole('article')
      .find((a) => within(a).queryAllByRole('radio').length > 0);
    // Set code 4242 is fixed, so this set always contains a multiple-choice question.
    if (!card) throw new Error('set 4242 has no multiple-choice question');
    fireEvent.click(within(card).getAllByRole('radio')[0] as HTMLElement);
    fireEvent.click(within(card).getByRole('button', { name: 'Check answer' }));
    const qid = card.getAttribute('data-question-id') ?? '';
    await waitFor(async () => {
      const ids = await Promise.all(
        [
          'm01-dc-motor',
          'm02-ac-motor',
          'm03-power-converters',
          'm04-stepper',
          'm05-servo',
          'm06-transmission',
          'm07-cam-follower',
          'm08-pneumatics',
          'm09-electro-pneumatics',
          'm10-electrohydraulics',
        ].map(async (m) =>
          ((await repo.get<Attempt[]>(attemptsKey(m))) ?? []).map((a) => a.questionId),
        ),
      );
      expect(ids.flat()).toContain(qid);
    });
    expect(screen.getByTestId('practice-summary')).toHaveTextContent(/Answered 1/);
  });
});

describe('question card: chain and explanation', () => {
  it('chain question marks each part, with error carried forward', () => {
    const q = M01_QUESTIONS.find((x) => x.kind === 'chain') as ChainQuestion;
    const inst = q.generate(3);
    const attempts: Attempt[] = [];
    render(
      <QuestionCard question={q} number={1} initialSeed={3} onAttempt={(a) => attempts.push(a)} />,
    );
    const inputs = screen.getAllByRole('textbox');
    const wrongVf = (inst.parts[0]?.answer ?? 0) * 1.1;
    const own = inst.parts[1]?.compute([wrongVf]) ?? 0;
    const values = [
      wrongVf,
      own,
      inst.parts[2]?.answer ?? 0,
      inst.parts[3]?.compute([wrongVf, own, inst.parts[2]?.answer ?? 0]) ?? 0,
    ];
    inputs.forEach((el, i) => fireEvent.change(el, { target: { value: String(values[i]) } }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(attempts[0]?.partResults).toEqual(['wrong', 'ecf', 'correct', 'ecf']);
    expect(screen.getByRole('status')).toHaveTextContent(/error carried forward/);
  });

  it('explanation is saved for the lecturer, unmarked, and shows the marking guide', () => {
    const q = M01_QUESTIONS.find((x) => x.kind === 'explanation') as ExplanationQuestion;
    const attempts: Attempt[] = [];
    render(<QuestionCard question={q} number={1} onAttempt={(a) => attempts.push(a)} />);
    const save = screen.getByRole('button', { name: 'Save answer' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: /marked by your lecturer/ }), {
      target: { value: 'No back-emf at standstill.' },
    });
    fireEvent.click(save);
    expect(attempts[0]).toMatchObject({
      marking: 'lecturer',
      answerGiven: 'No back-emf at standstill.',
    });
    expect(screen.getByRole('status')).toHaveTextContent(/Marking guide/);
  });
});

describe('progress page', () => {
  it('totals all laboratories, by level and course LO, and counts answers awaiting the lecturer', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set(attemptsKey('m01-dc-motor'), [
      attempt('m01.mcq.back-emf', true),
      attempt('m01.mcq.back-emf', false),
      attempt('m01.explain', false, { marking: 'lecturer' }),
    ]);
    await repo.set(sessionsKey('m02-ac-motor'), [
      {
        id: 's',
        moduleId: 'm02-ac-motor',
        activityId: '',
        startedAt: '',
        rows: [{ time: 0, parameters: {}, measurements: {} }],
      },
    ]);
    await repo.set(PROGRESS_KEY, {
      'm01-dc-motor': { activitiesCompleted: ['a'], reportsGenerated: 2, lastOpened: null },
    });
    open('/progress', repo);
    const table = await screen.findByTestId('progress-table');
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(12));
    const dc = table.querySelector('[data-module-id="m01-dc-motor"]') as HTMLElement;
    expect(dc).toHaveTextContent(/1 \/ 2 \(50 %\)/);
    expect(screen.getByTestId('progress-total-score')).toHaveTextContent('1 / 2 (50 %)');
    expect(screen.getByTestId('progress-levels')).toHaveTextContent(/Beginner\s*1 \/ 2/);
    expect(screen.getByTestId('progress-los')).toHaveTextContent(/LO1.*1 \/ 2/);
  });

  it('deleting all data needs a confirmation', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set(attemptsKey('m01-dc-motor'), [attempt('m01.mcq.back-emf', true)]);
    open('/progress', repo);
    await screen.findByTestId('progress-table');
    fireEvent.click(screen.getByRole('button', { name: 'Delete all my VADL data…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await repo.get(attemptsKey('m01-dc-motor'))).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Delete all my VADL data…' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    await waitFor(async () => expect(await repo.get(attemptsKey('m01-dc-motor'))).toBeNull());
    expect(await screen.findByText(/has been deleted/)).toBeInTheDocument();
  });
});

describe('reports', () => {
  it('the reports page shows each report’s status', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set(reportKey('m03-power-converters'), {
      discussion: 'x',
      conclusion: '',
      updatedAt: null,
    });
    open('/reports', repo);
    expect(await screen.findByTestId('report-status-m03-power-converters')).toHaveTextContent(
      /discussion started/,
    );
    expect(screen.getByTestId('report-status-m01-dc-motor')).toHaveTextContent(/0 rows recorded/);
  });

  it('a report lists lecturer-marked answers and results by level and LO; the CSV button needs rows', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set(attemptsKey('m01-dc-motor'), [
      attempt('m01.mcq.back-emf', true),
      attempt('m01.explain', false, { marking: 'lecturer', answerGiven: 'Eg is zero at rest.' }),
    ]);
    open('/reports/m01-dc-motor', repo);
    expect(await screen.findByTestId('report-lecturer')).toHaveTextContent('Eg is zero at rest.');
    expect(screen.getByTestId('report-score')).toHaveTextContent('1 of 1');
    expect(screen.getByTestId('report-los')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download recorded data (CSV)' })).toBeDisabled();
  });
});

describe('M09 design tasks', () => {
  it('checks the student’s ladder by simulation and saves the result as an attempt', async () => {
    const repo = open('/modules/electro-pneumatics');
    const panel = await screen.findByTestId('design-tasks');
    // Part A (S1 → 1M1) meets the OR task only partly: S2 does nothing.
    fireEvent.click(within(panel).getByRole('button', { name: 'Check my ladder' }));
    expect(within(panel).getByTestId('design-result')).toHaveTextContent(/Not yet/);
    await waitFor(async () =>
      expect(
        ((await repo.get<Attempt[]>(attemptsKey('m09-electro-pneumatics'))) ?? [])[0],
      ).toMatchObject({
        questionId: 'm09.design.or',
        correct: false,
      }),
    );
  });
});
