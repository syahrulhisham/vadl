import { useState } from 'react';
import { useStoredValue } from '@/hooks';
import { t } from '@/i18n';
import { attemptsKey } from '@/storage';
import { QuestionCard } from './QuestionCard';
import type { Attempt, LearningLevel, Question } from './types';

export interface AssessmentPanelProps {
  readonly moduleId: string;
  readonly questions: readonly Question[];
}

const LEVELS: readonly (LearningLevel | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced'];

/**
 * Module assessment: questions at three levels, immediate feedback, attempts
 * saved in the browser (FR-10, FR-12). Scores are self-study only (D11).
 */
export function AssessmentPanel({ moduleId, questions }: AssessmentPanelProps) {
  const [level, setLevel] = useState<LearningLevel | 'all'>('all');
  const attempts = useStoredValue<Attempt[]>(attemptsKey(moduleId), []);
  const shown = level === 'all' ? questions : questions.filter((q) => q.level === level);
  const correct = attempts.value.filter((a) => a.correct).length;

  return (
    <div className="space-y-4">
      <label className="block max-w-xs text-sm font-medium text-navy-800">
        {t('quiz.filterLabel')}
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as LearningLevel | 'all')}
          className="mt-1 block min-h-touch w-full rounded-md border border-navy-200 bg-white px-2 text-navy-900"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === 'all' ? t('quiz.all') : t(`level.${l}`)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-navy-700" data-testid="quiz-score">
        {t('quiz.score', { correct, total: attempts.value.length })} {t('quiz.purpose')}
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        {shown.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            number={questions.indexOf(q) + 1}
            onAttempt={(a) => attempts.update((list) => [...list, a])}
          />
        ))}
      </div>
    </div>
  );
}
