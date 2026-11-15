import { useRef, useState } from 'react';
import { Button, PageHeader, Panel } from '@/design-system';
import {
  bankStats,
  buildPracticeSet,
  LEVELS,
  newSeed,
  QuestionCard,
  type Attempt,
  type LearningLevel,
  type Question,
} from '@/features/assessment';
import { selectClass } from '@/features/lab-shell';
import { t } from '@/i18n';
import { moduleTitle } from '@/modules/courseRefs';
import { builtLab } from '@/modules/labs';
import { MODULES } from '@/modules/registry';
import { attemptsKey, useRepository } from '@/storage';
import { useDocumentTitle } from '../useDocumentTitle';

interface Item {
  readonly question: Question;
  readonly moduleId: string;
  readonly moduleLabel: string;
}

const COUNTS = [5, 10, 15, 20] as const;

/** All built modules with their banks. */
function banks() {
  return MODULES.flatMap((m) => {
    const lab = builtLab(m.id);
    return lab
      ? [{ module: m, label: `${m.number}. ${moduleTitle(m)}`, questions: lab.questions }]
      : [];
  });
}

/** Banks are fixed at build time. */
const ALL_BANKS = banks();

/**
 * Assessment centre (FR-10, FR-11): an overview of every question bank and
 * practice sets across laboratories. Answers are saved to each laboratory, so
 * progress and reports include them. Scores are for self-study only (D11).
 */
export default function AssessmentCentrePage() {
  useDocumentTitle(t('assessment.title'));
  const { repository } = useRepository();
  const all = ALL_BANKS;
  const [selected, setSelected] = useState<readonly string[]>(() => all.map((b) => b.module.id));
  const [level, setLevel] = useState<LearningLevel | 'all'>('all');
  const [count, setCount] = useState<number>(10);
  const [code, setCode] = useState('');
  const [set, setSet] = useState<{ seed: number; items: readonly Item[] } | null>(null);
  const [answered, setAnswered] = useState<Readonly<Record<string, boolean>>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());

  function create() {
    const parsed = Number.parseInt(code, 10);
    const seed = Number.isFinite(parsed) && parsed >= 0 ? parsed : newSeed();
    const pool: Item[] = all
      .filter((b) => selected.includes(b.module.id))
      .flatMap((b) =>
        b.questions
          .filter((q) => level === 'all' || q.level === level)
          .map((q) => ({ question: q, moduleId: b.module.id, moduleLabel: b.label })),
      );
    setSet({ seed, items: buildPracticeSet(pool, seed, count) });
    setCode(String(seed));
    setAnswered({});
  }

  function record(moduleId: string, attempt: Attempt) {
    setAnswered((a) => ({
      ...a,
      [attempt.questionId]: attempt.correct && attempt.marking !== 'lecturer',
    }));
    // Append in order: each write waits for the previous one.
    queue.current = queue.current.then(async () => {
      const key = attemptsKey(moduleId);
      const list = (await repository.get<Attempt[]>(key)) ?? [];
      await repository.set(key, [...list, attempt]);
    });
  }

  const answeredCount = Object.keys(answered).length;
  const correctCount = Object.values(answered).filter(Boolean).length;

  return (
    <>
      <PageHeader title={t('assessment.title')} intro={t('assessment.intro')} icon="assessment" />
      <div className="space-y-4">
        <Panel title={t('assessment.bankTitle')}>
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[36rem] border-collapse text-left text-sm"
              data-testid="bank-table"
            >
              <caption className="mb-1 text-left text-navy-700">
                {t('assessment.bankCaption')}
              </caption>
              <thead>
                <tr className="border-b border-navy-200 text-navy-800">
                  <th scope="col" className="py-2 pr-3">
                    {t('progress.module')}
                  </th>
                  <th scope="col" className="py-2 pr-3">
                    {t('assessment.total')}
                  </th>
                  {LEVELS.map((l) => (
                    <th key={l} scope="col" className="py-2 pr-3">
                      {t(`level.${l}`)}
                    </th>
                  ))}
                  <th scope="col" className="py-2">
                    {t('assessment.types')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {all.map((b) => {
                  const s = bankStats(b.questions);
                  return (
                    <tr key={b.module.id} className="border-b border-navy-100">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        {b.label}
                      </th>
                      <td className="py-2 pr-3">{s.total}</td>
                      {LEVELS.map((l) => (
                        <td key={l} className="py-2 pr-3">
                          {s.byLevel[l]}
                        </td>
                      ))}
                      <td className="py-2 text-navy-700">
                        {Object.entries(s.byKind)
                          .map(([k, n]) => `${t(`quiz.kind.${k}`)} ${n}`)
                          .join(', ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={t('assessment.practiceTitle')}>
          <div className="space-y-3">
            <p className="text-sm text-navy-700">{t('assessment.practiceIntro')}</p>
            <fieldset>
              <legend className="text-sm font-medium text-navy-800">
                {t('assessment.modules')}
              </legend>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                {all.map((b) => (
                  <label
                    key={b.module.id}
                    className="flex min-h-touch items-center gap-2 text-sm text-navy-900"
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-navy-700"
                      checked={selected.includes(b.module.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked
                            ? [...s, b.module.id]
                            : s.filter((id) => id !== b.module.id),
                        )
                      }
                    />
                    {b.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block text-sm font-medium text-navy-800">
                {t('quiz.filterLabel')}
                <select
                  className={selectClass}
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LearningLevel | 'all')}
                >
                  <option value="all">{t('quiz.all')}</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {t(`level.${l}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-navy-800">
                {t('assessment.count')}
                <select
                  className={selectClass}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {COUNTS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-navy-800">
                {t('assessment.code')}
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block min-h-touch w-40 rounded-md border border-navy-200 px-2 text-navy-900"
                />
              </label>
              <Button onClick={create} disabled={selected.length === 0}>
                {t('assessment.create')}
              </Button>
            </div>
            <p className="text-xs text-navy-600">{t('assessment.codeHint')}</p>
          </div>
        </Panel>

        {set ? (
          <section
            aria-label={t('assessment.setTitle')}
            className="space-y-3"
            data-testid="practice-set"
          >
            <p className="text-sm text-navy-800" role="status" data-testid="practice-summary">
              {t('assessment.setSummary', {
                code: set.seed,
                n: set.items.length,
                answered: answeredCount,
                correct: correctCount,
              })}
            </p>
            {set.items.length === 0 ? <p>{t('assessment.empty')}</p> : null}
            <div className="grid gap-4 xl:grid-cols-2">
              {set.items.map((item, i) => (
                <QuestionCard
                  key={`${set.seed}-${item.question.id}`}
                  question={item.question}
                  number={i + 1}
                  context={item.moduleLabel}
                  initialSeed={(set.seed + i * 7919) >>> 0}
                  onAttempt={(a) => record(item.moduleId, a)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <Panel title={t('nav.assessment')} tone="info">
          <p>{t('assessment.purpose')}</p>
        </Panel>
      </div>
    </>
  );
}
