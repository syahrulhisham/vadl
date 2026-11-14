import { useId, type ReactNode } from 'react';
import { Button } from '@/design-system';
import type { Attempt, Question } from '@/features/assessment/types';
import { CharacteristicChart } from '@/features/graphs';
import { withModuleProgress, type ProgressRecord } from '@/features/progress';
import { ResultsTable } from '@/features/recording';
import { useStoredValue } from '@/hooks';
import { t } from '@/i18n';
import { attemptsKey, PROFILE_KEY, PROGRESS_KEY, reportKey, sessionsKey } from '@/storage';
import { EMPTY_DRAFT, type ReportDefinition, type ReportDraft } from './definition';
import { graphPoints, summariseAttempts } from './reportData';
import {
  REPORT_SECTIONS,
  type ExperimentSession,
  type ReportSection,
  type StudentIdentification,
} from './types';

const EMPTY_STUDENT: StudentIdentification = {
  name: '',
  matricNumber: '',
  programme: '',
  section: '',
  lecturerName: '',
  date: '',
};

const STUDENT_FIELDS: readonly (keyof StudentIdentification)[] = [
  'name',
  'matricNumber',
  'programme',
  'section',
  'lecturerName',
  'date',
];

function Section({ id, n, children }: { id: ReportSection; n: number; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-section={id} className="break-inside-avoid space-y-2">
      <h2 id={headingId} className="text-lg font-semibold text-navy-800">
        {n}. {t(`report.section.${id}`)}
      </h2>
      {children}
    </section>
  );
}

export interface ReportViewProps {
  readonly definition: ReportDefinition;
  readonly questions: readonly Question[];
  /** Printing hook, injectable for tests. Defaults to the browser print dialog (D7). */
  readonly print?: () => void;
}

/**
 * Laboratory report with the ten sections of master instruction §8, built only
 * from the student's recorded rows, attempts and own writing. Exported as PDF
 * through the browser's print dialog (decision D7).
 */
export function ReportView({
  definition: d,
  questions,
  print = () => window.print(),
}: ReportViewProps) {
  const student = useStoredValue<StudentIdentification>(PROFILE_KEY, EMPTY_STUDENT);
  const sessions = useStoredValue<ExperimentSession[]>(sessionsKey(d.moduleId), []);
  const attempts = useStoredValue<Attempt[]>(attemptsKey(d.moduleId), []);
  const draft = useStoredValue<ReportDraft>(reportKey(d.moduleId), EMPTY_DRAFT);
  const progress = useStoredValue<ProgressRecord>(PROGRESS_KEY, {});
  const rows = sessions.value.flatMap((s) => s.rows);
  const points = graphPoints(rows, d.graph.x, d.graph.y);
  const summary = summariseAttempts(attempts.value, questions);
  const fieldClass =
    'mt-1 block min-h-touch w-full rounded-md border border-navy-200 px-2 text-navy-900 print:border-0 print:px-0';

  function exportPdf() {
    progress.update((r) =>
      withModuleProgress(r, d.moduleId, (m) => ({
        ...m,
        reportsGenerated: m.reportsGenerated + 1,
      })),
    );
    print();
  }

  const sectionBody: Record<ReportSection, ReactNode> = {
    'student-identification': (
      <div className="grid gap-3 sm:grid-cols-2">
        {STUDENT_FIELDS.map((f) => (
          <label key={f} className="block text-sm font-medium text-navy-800">
            {t(`report.student.${f}`)}
            <input
              type={f === 'date' ? 'date' : 'text'}
              value={student.value[f]}
              onChange={(e) => student.update((s) => ({ ...s, [f]: e.target.value }))}
              className={fieldClass}
            />
          </label>
        ))}
        <p className="text-sm text-navy-600 sm:col-span-2 print:hidden">{t('report.privacy')}</p>
      </div>
    ),
    'experiment-title': <p className="text-navy-900">{d.title}</p>,
    'learning-objectives': (
      <ul className="list-disc space-y-1 pl-5">
        {d.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
    ),
    'theory-and-equations': (
      <>
        <ul className="space-y-1 font-mono text-sm text-navy-900">
          {d.equations.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <h3 className="font-semibold text-navy-800">{t('report.assumptions')}</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {d.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </>
    ),
    'experimental-parameters':
      rows.length === 0 ? (
        <p>{t('report.noRows')}</p>
      ) : (
        <ResultsTable
          rows={rows}
          columns={d.parameterColumns}
          caption={t('report.parametersCaption')}
        />
      ),
    'recorded-measurements':
      rows.length === 0 ? (
        <p>{t('report.noRows')}</p>
      ) : (
        <ResultsTable
          rows={rows}
          columns={d.measurementColumns}
          caption={t('report.measurementsCaption')}
        />
      ),
    'generated-graphs':
      points.length < 2 ? (
        <p>{t('report.needTwoRows')}</p>
      ) : (
        <figure className="space-y-1">
          <figcaption className="font-medium text-navy-800">{d.graph.title}</figcaption>
          <div role="img" aria-label={d.graph.title} data-testid="report-graph">
            <CharacteristicChart
              curve={points}
              point={null}
              xLabel={`${d.graph.x.label} (${d.graph.x.unit})`}
              yLabel={`${d.graph.y.label} (${d.graph.y.unit})`}
              height={260}
            />
          </div>
          <p className="text-sm text-navy-600">{t('report.graphNote', { n: points.length })}</p>
        </figure>
      ),
    'analysis-and-discussion': (
      <textarea
        aria-label={t('report.section.analysis-and-discussion')}
        value={draft.value.discussion}
        onChange={(e) =>
          draft.update((s) => ({
            ...s,
            discussion: e.target.value,
            updatedAt: new Date().toISOString(),
          }))
        }
        rows={8}
        placeholder={t('report.discussionHint')}
        className="block w-full rounded-md border border-navy-200 p-2 text-navy-900 print:border-0 print:p-0"
      />
    ),
    conclusion: (
      <textarea
        aria-label={t('report.section.conclusion')}
        value={draft.value.conclusion}
        onChange={(e) =>
          draft.update((s) => ({
            ...s,
            conclusion: e.target.value,
            updatedAt: new Date().toISOString(),
          }))
        }
        rows={5}
        placeholder={t('report.conclusionHint')}
        className="block w-full rounded-md border border-navy-200 p-2 text-navy-900 print:border-0 print:p-0"
      />
    ),
    'assessment-results':
      summary.total === 0 ? (
        <p>{t('report.noAttempts')}</p>
      ) : (
        <>
          <p data-testid="report-score">
            {t('report.score', { correct: summary.correct, total: summary.total })}
          </p>
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-navy-200">
                <th scope="col" className="py-1 pr-3">
                  {t('report.colQuestion')}
                </th>
                <th scope="col" className="py-1 pr-3">
                  {t('report.colAttempts')}
                </th>
                <th scope="col" className="py-1 pr-3">
                  {t('report.colCorrect')}
                </th>
                <th scope="col" className="py-1">
                  {t('report.colLatest')}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.byQuestion.map((q) => (
                <tr key={q.questionId} className="border-b border-navy-100">
                  <th scope="row" className="py-1 pr-3 font-normal">
                    {q.label}
                  </th>
                  <td className="py-1 pr-3">{q.attempts}</td>
                  <td className="py-1 pr-3">{q.correct}</td>
                  <td className="py-1">{q.latestCorrect ? t('report.yes') : t('report.no')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-navy-600">{t('quiz.purpose')}</p>
        </>
      ),
  };

  return (
    <article className="space-y-6" data-testid="lab-report">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Button onClick={exportPdf}>{t('report.print')}</Button>
        <span className="text-sm text-navy-600">{t('report.printHint')}</span>
      </div>
      {REPORT_SECTIONS.map((s, i) => (
        <Section key={s} id={s} n={i + 1}>
          {sectionBody[s]}
        </Section>
      ))}
      <p className="text-sm text-navy-600">{t('reports.honesty')}</p>
    </article>
  );
}
