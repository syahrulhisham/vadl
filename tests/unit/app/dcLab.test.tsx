// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import {
  attemptsKey,
  createLocalStorageRepository,
  createMemoryStorage,
  PROFILE_KEY,
  PROGRESS_KEY,
  RepositoryProvider,
  sessionsKey,
  type Repository,
} from '@/storage';

function open(
  path: string,
  repository: Repository = createLocalStorageRepository(createMemoryStorage()),
) {
  render(
    <RepositoryProvider repository={repository}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </RepositoryProvider>,
  );
  return repository;
}

const value = (name: string) =>
  within(screen.getByRole('group', { name, exact: true } as never)).getByTestId('measurement-value')
    .textContent;

describe('DC motor laboratory page', () => {
  it('fills all seven regions with laboratory content', async () => {
    open('/modules/dc-motor-drives');
    const shell = await screen.findByTestId('lab-shell');
    expect(within(shell).getAllByRole('region')).toHaveLength(7);
    expect(screen.queryByText(/This region is filled when the laboratory is built/)).toBeNull();
    expect(
      screen.getByText(/Armature circuit \(steady state\): Va = Eg \+ Ia·Ra/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(10); // questions
    expect(screen.getByText('Starting a DC motor')).toBeInTheDocument();
  });

  it('shows real model values at rest: Va 220 V, If 1 A, n 0 rpm', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('dc-diagram');
    expect(value('Armature voltage')).toBe('220');
    expect(value('Field current')).toBe('1');
    expect(value('Speed')).toBe('0');
  });

  it('presets switch the motor; the converter preset shows Va = 198.1 V', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('dc-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Converter-fed' }));
    expect(value('Armature voltage')).toBe('198.1');
    expect(value('Field current')).toBe('2.264');
    fireEvent.click(screen.getByRole('button', { name: 'Series' }));
    expect(screen.getByLabelText(/Series constant Kaf \(H\)/)).toBeInTheDocument();
  });

  it('locks structural choices while running and allows live supply changes', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('dc-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('combobox', { name: 'Motor type' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Shunt' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Armature voltage Va \(V\)/), {
      target: { value: '180' },
    });
    expect(value('Armature voltage')).toBe('180');
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('combobox', { name: 'Motor type' })).toBeEnabled();
  });

  it('refuses a zero field with an explanation', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('dc-diagram');
    fireEvent.change(screen.getByLabelText(/Field voltage Vf \(V\)/), { target: { value: '0' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/no torque/);
    expect(value('Field current')).toBe('1');
  });

  it('records rows into browser storage and marks activities completed', async () => {
    const repo = open('/modules/dc-motor-drives');
    await screen.findByTestId('dc-diagram');
    fireEvent.click(screen.getByRole('button', { name: 'Record measurement' }));
    const table = screen.getByRole('table', { name: /Recorded measurements/ });
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    const box = screen.getAllByRole('checkbox', { name: 'Mark as completed' })[0] as HTMLElement;
    fireEvent.click(box);
    await screen.findByText('✓');
    const sessions = await repo.get<{ rows: unknown[] }[]>(sessionsKey('m01-dc-motor'));
    expect(sessions?.[0]?.rows).toHaveLength(1);
    const progress =
      await repo.get<Record<string, { activitiesCompleted: string[]; lastOpened: string }>>(
        PROGRESS_KEY,
      );
    expect(progress?.['m01-dc-motor']?.activitiesCompleted).toEqual(['m01.act.starting']);
    expect(progress?.['m01-dc-motor']?.lastOpened).toMatch(/^\d{4}-/);
  });
});

describe('laboratory report (thin, D9)', () => {
  it('has the ten sections and says so when nothing is recorded', async () => {
    open('/reports/m01-dc-motor');
    const report = await screen.findByTestId('lab-report');
    expect(report.querySelectorAll('section[data-section]')).toHaveLength(10);
    expect(screen.getAllByText(/No measurements have been recorded yet/)).toHaveLength(2);
    expect(screen.getByText(/Record at least two rows/)).toBeInTheDocument();
    expect(screen.getByText('No assessment questions answered yet.')).toBeInTheDocument();
  });

  it('uses only stored rows, attempts and the student’s own text; print counts a report', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    const row = (torque: number, speedRpm: number) => ({
      time: 2,
      parameters: { armatureVoltage: 220 },
      measurements: { torque, speedRpm, armatureCurrent: torque / 1.2 },
    });
    await repo.set(sessionsKey('m01-dc-motor'), [
      {
        id: 's',
        moduleId: 'm01-dc-motor',
        activityId: 'x',
        startedAt: '',
        rows: [row(24, 1671.1), row(12, 1721.3)],
      },
    ]);
    await repo.set(attemptsKey('m01-dc-motor'), [
      {
        questionId: 'm01.mcq.back-emf',
        seed: null,
        answerGiven: 'b',
        correct: true,
        answeredAt: '',
      },
      {
        questionId: 'm01.mcq.back-emf',
        seed: null,
        answerGiven: 'a',
        correct: false,
        answeredAt: '',
      },
    ]);
    let printed = 0;
    render(
      <RepositoryProvider repository={repo}>
        <MemoryRouter>
          {/* ReportView directly, with an injected print function */}
          <ReportUnderTest onPrint={() => (printed += 1)} />
        </MemoryRouter>
      </RepositoryProvider>,
    );
    expect(await screen.findByTestId('report-graph')).toBeInTheDocument();
    expect(screen.getByText('Drawn from your 2 recorded rows only.')).toBeInTheDocument();
    expect(screen.getByTestId('report-score')).toHaveTextContent(
      'Correct answers: 1 of 2 attempts.',
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Student' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Conclusion' }), {
      target: { value: 'Speed fell slightly with load.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(printed).toBe(1);
    await new Promise((r) => setTimeout(r, 0));
    expect((await repo.get<{ name: string }>(PROFILE_KEY))?.name).toBe('Test Student');
    const progress = await repo.get<Record<string, { reportsGenerated: number }>>(PROGRESS_KEY);
    expect(progress?.['m01-dc-motor']?.reportsGenerated).toBe(1);
  });

  it('an unknown report says so', async () => {
    open('/reports/m99-none');
    expect(
      await screen.findByText('There is no report for this laboratory yet.'),
    ).toBeInTheDocument();
  });
});

describe('progress and reports areas', () => {
  it('progress lists the DC laboratory with stored counts', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set(PROGRESS_KEY, {
      'm01-dc-motor': { activitiesCompleted: ['a', 'b'], reportsGenerated: 3, lastOpened: null },
    });
    open('/progress', repo);
    const row = (await screen.findByText(/1\. DC Motor Drives/)).closest('tr') as HTMLElement;
    expect(row).toHaveTextContent('2 / 5');
    expect(row).toHaveTextContent('3');
    expect(row).toHaveTextContent('Not yet');
  });

  it('the reports area links to every built laboratory report', async () => {
    open('/reports');
    const links = await screen.findAllByRole('link', { name: 'Open report' });
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/reports/m01-dc-motor',
      '/reports/m02-ac-motor',
      '/reports/m03-power-converters',
      '/reports/m04-stepper',
      '/reports/m05-servo',
      '/reports/m06-transmission',
      '/reports/m07-cam-follower',
    ]);
  });
});

// Local helper: render the M01 report with an injectable print function.
import { ReportView } from '@/features/reports';
import { M01_QUESTIONS } from '@/modules/m01-dc-motor/questions';
import { M01_REPORT } from '@/modules/m01-dc-motor/report';
function ReportUnderTest({ onPrint }: { onPrint: () => void }) {
  return <ReportView definition={M01_REPORT} questions={M01_QUESTIONS} print={onPrint} />;
}
