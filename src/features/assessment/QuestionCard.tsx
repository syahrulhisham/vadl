import { useId, useState } from 'react';
import { Button, StatusBadge } from '@/design-system';
import { t } from '@/i18n';
import {
  emptySequenceAnswer,
  markCalculation,
  markChoice,
  markSequence,
  type MarkResult,
} from './marking';
import { newSeed } from './rng';
import { SequenceTableInput } from './SequenceTableInput';
import type { Attempt, Question, SequenceAnswer } from './types';

export interface QuestionCardProps {
  readonly question: Question;
  readonly number: number;
  readonly onAttempt: (attempt: Attempt) => void;
  /** Seed for the first instance of a calculation question (tests pass a fixed one). */
  readonly initialSeed?: number;
}

/** One question with immediate feedback and an explanation (FR-10). */
export function QuestionCard({ question, number, onAttempt, initialSeed }: QuestionCardProps) {
  const id = useId();
  const [seed, setSeed] = useState(() => initialSeed ?? newSeed());
  const [answer, setAnswer] = useState('');
  const [table, setTable] = useState<SequenceAnswer | null>(null);
  const [result, setResult] = useState<MarkResult | null>(null);
  const calc = question.kind === 'calculation' ? question.generate(seed) : null;
  const seq = question.kind === 'sequence' ? question.generate(seed) : null;
  const sheet = seq ? (table ?? emptySequenceAnswer(seq)) : null;
  const stem = calc ? calc.stem : seq ? seq.stem : 'stem' in question ? question.stem : '';
  const ready = seq && sheet ? sheet.angles.every((a) => a.trim() !== '') : answer.trim() !== '';

  function check() {
    let mark: MarkResult;
    let given = answer;
    if (calc) mark = markCalculation(answer, calc);
    else if (seq && sheet) {
      mark = markSequence(sheet, seq);
      given = JSON.stringify(sheet);
    } else if (question.kind === 'multiple-choice' || question.kind === 'troubleshooting') {
      mark = markChoice(question, answer);
    } else return;
    setResult(mark);
    onAttempt({
      questionId: question.id,
      seed: calc || seq ? seed : null,
      answerGiven: given,
      correct: mark.correct,
      answeredAt: new Date().toISOString(),
    });
  }

  function renumber() {
    setSeed(newSeed());
    setAnswer('');
    setTable(null);
    setResult(null);
  }

  return (
    <article
      aria-labelledby={`${id}-title`}
      className="rounded-md border border-navy-100 bg-white p-4"
      data-question-id={question.id}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 id={`${id}-title`} className="font-semibold text-navy-800">
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
            className="mt-1 block min-h-touch w-48 rounded-md border border-navy-200 px-2 text-navy-900"
          />
        </label>
      ) : seq && sheet ? (
        <SequenceTableInput instance={seq} value={sheet} onChange={setTable} />
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
          {t('quiz.check')}
        </Button>
        {calc || seq ? (
          <Button variant="secondary" onClick={renumber}>
            {t('quiz.newNumbers')}
          </Button>
        ) : null}
      </div>

      {result ? (
        <div className="mt-3 space-y-2" role="status">
          <p
            className={`rounded px-3 py-2 text-sm font-medium ${
              result.correct
                ? 'bg-lightblue-100 text-navy-900'
                : 'bg-status-dangerBg text-status-danger'
            }`}
          >
            {result.feedback}
          </p>
          <p className="whitespace-pre-line text-sm text-navy-700">
            <span className="font-semibold">{t('quiz.explanation')}: </span>
            {result.explanation}
          </p>
        </div>
      ) : null}
    </article>
  );
}
