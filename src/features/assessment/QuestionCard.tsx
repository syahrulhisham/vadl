import { useId, useState } from 'react';
import { Button, StatusBadge } from '@/design-system';
import { t } from '@/i18n';
import {
  emptySequenceAnswer,
  markCalculation,
  markChain,
  markChoice,
  markSequence,
  markTable,
  type MarkResult,
} from './marking';
import { newSeed } from './rng';
import { NumericTableInput } from './NumericTableInput';
import { SequenceTableInput } from './SequenceTableInput';
import type { Attempt, PartResult, Question, SequenceAnswer } from './types';

export interface QuestionCardProps {
  readonly question: Question;
  readonly number: number;
  readonly onAttempt: (attempt: Attempt) => void;
  /** Seed for the first instance of a generated question (tests pass a fixed one). */
  readonly initialSeed?: number;
  /** Optional label shown before the question number (e.g. the module in a practice set). */
  readonly context?: string;
}

interface Shown extends MarkResult {
  /** 'lecturer' results are not marked; shown neutrally with the marking guide. */
  readonly lecturer?: boolean;
  readonly parts?: readonly PartResult[];
}

const inputClass =
  'mt-1 block min-h-touch w-48 rounded-md border border-navy-200 px-2 text-navy-900';

/** One question with immediate feedback and an explanation (FR-10). */
export function QuestionCard({
  question,
  number,
  onAttempt,
  initialSeed,
  context,
}: QuestionCardProps) {
  const id = useId();
  const [seed, setSeed] = useState(() => initialSeed ?? newSeed());
  const [answer, setAnswer] = useState('');
  const [table, setTable] = useState<SequenceAnswer | null>(null);
  const [values, setValues] = useState<string[] | null>(null);
  const [result, setResult] = useState<Shown | null>(null);
  const calc = question.kind === 'calculation' ? question.generate(seed) : null;
  const seq = question.kind === 'sequence' ? question.generate(seed) : null;
  const tab = question.kind === 'table' ? question.generate(seed) : null;
  const chain = question.kind === 'chain' ? question.generate(seed) : null;
  const sheet = seq ? (table ?? emptySequenceAnswer(seq)) : null;
  const cells = tab
    ? (values ?? tab.rows.map(() => ''))
    : chain
      ? (values ?? chain.parts.map(() => ''))
      : null;
  const generated = calc ?? seq ?? tab ?? chain;
  const stem = generated ? generated.stem : 'stem' in question ? question.stem : '';
  const ready =
    seq && sheet
      ? sheet.angles.every((a) => a.trim() !== '')
      : cells
        ? cells.every((v) => v.trim() !== '')
        : answer.trim() !== '';

  function check() {
    let mark: Shown;
    let given = answer;
    let extra: Partial<Attempt> = {};
    if (calc) mark = markCalculation(answer, calc);
    else if (seq && sheet) {
      mark = markSequence(sheet, seq);
      given = JSON.stringify(sheet);
    } else if (tab && cells) {
      mark = markTable(cells, tab);
      given = JSON.stringify(cells);
    } else if (chain && cells) {
      const m = markChain(cells, chain);
      mark = m;
      given = JSON.stringify(cells);
      extra = { partResults: m.parts };
    } else if (question.kind === 'explanation') {
      mark = {
        correct: false,
        lecturer: true,
        feedback: t('quiz.savedForLecturer'),
        explanation: question.markingGuide.map((g) => `• ${g}`).join('\n'),
      };
      extra = { marking: 'lecturer' };
    } else if (question.kind === 'multiple-choice' || question.kind === 'troubleshooting') {
      mark = markChoice(question, answer);
    } else return;
    setResult(mark);
    onAttempt({
      questionId: question.id,
      seed: generated ? seed : null,
      answerGiven: given,
      correct: mark.correct,
      answeredAt: new Date().toISOString(),
      ...extra,
    });
  }

  function renumber() {
    setSeed(newSeed());
    setAnswer('');
    setTable(null);
    setValues(null);
    setResult(null);
  }

  const feedbackClass = result?.lecturer
    ? 'bg-navy-50 text-navy-900'
    : result?.correct
      ? 'bg-lightblue-100 text-navy-900'
      : 'bg-status-dangerBg text-status-danger';

  return (
    <article
      aria-labelledby={`${id}-title`}
      className="rounded-md border border-navy-100 bg-white p-4"
      data-question-id={question.id}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 id={`${id}-title`} className="font-semibold text-navy-800">
          {context ? `${context} — ` : ''}
          {t('quiz.question', { n: number })}
        </h3>
        <StatusBadge>{t(`level.${question.level}`)}</StatusBadge>
        <StatusBadge tone="info">{t(`quiz.kind.${question.kind}`)}</StatusBadge>
      </div>
      <p className="mb-3 whitespace-pre-line text-navy-900">{stem}</p>

      {calc ? (
        <label className="block text-sm font-medium text-navy-800">
          {t('quiz.answerLabel', { unit: calc.unit })}
          <input
            type="text"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') check();
            }}
            className={inputClass}
          />
        </label>
      ) : seq && sheet ? (
        <SequenceTableInput instance={seq} value={sheet} onChange={setTable} />
      ) : tab && cells ? (
        <NumericTableInput instance={tab} value={cells} onChange={setValues} />
      ) : chain && cells ? (
        <ol className="space-y-2">
          {chain.parts.map((part, i) => (
            <li key={part.label}>
              <label className="block text-sm font-medium text-navy-800">
                {part.label} {part.prompt} ({part.unit})
                <input
                  type="text"
                  inputMode="decimal"
                  value={cells[i] ?? ''}
                  onChange={(e) => setValues(cells.map((v, k) => (k === i ? e.target.value : v)))}
                  className={inputClass}
                />
              </label>
              {result?.parts?.[i] ? (
                <span className="text-sm text-navy-700" data-part-result={result.parts[i]}>
                  {t(`quiz.part.${result.parts[i]}`)}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : question.kind === 'explanation' ? (
        <label className="block text-sm font-medium text-navy-800">
          {t('quiz.explanationLabel')}
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            className="mt-1 block w-full rounded-md border border-navy-200 p-2 text-navy-900"
          />
        </label>
      ) : question.kind === 'multiple-choice' || question.kind === 'troubleshooting' ? (
        <fieldset>
          <legend className="sr-only">{stem}</legend>
          <div className="space-y-1">
            {question.choices.map((c) => (
              <label
                key={c.id}
                className="flex min-h-touch cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-navy-50"
              >
                <input
                  type="radio"
                  name={`${id}-choice`}
                  value={c.id}
                  checked={answer === c.id}
                  onChange={() => setAnswer(c.id)}
                  className="h-5 w-5 accent-navy-700"
                />
                <span className="text-navy-900">{c.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={check} disabled={!ready}>
          {question.kind === 'explanation' ? t('quiz.submitForLecturer') : t('quiz.check')}
        </Button>
        {generated ? (
          <Button variant="secondary" onClick={renumber}>
            {t('quiz.newNumbers')}
          </Button>
        ) : null}
      </div>

      {result ? (
        <div className="mt-3 space-y-2" role="status">
          <p className={`rounded px-3 py-2 text-sm font-medium ${feedbackClass}`}>
            {result.feedback}
          </p>
          <p className="whitespace-pre-line text-sm text-navy-700">
            <span className="font-semibold">
              {result.lecturer ? t('quiz.markingGuide') : t('quiz.explanation')}:{' '}
            </span>
            {result.explanation}
          </p>
        </div>
      ) : null}
    </article>
  );
}
