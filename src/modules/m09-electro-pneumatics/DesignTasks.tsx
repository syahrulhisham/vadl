import { useState } from 'react';
import { Button } from '@/design-system';
import type { Attempt } from '@/features/assessment';
import { selectClass } from '@/features/lab-shell';
import { useStoredValue } from '@/hooks';
import { checkLadderTask, LADDER_TASKS, type Ladder, type LadderTaskResult } from '@/sim-core';
import { attemptsKey } from '@/storage';
import { M09_LABELS as L } from './content.en';

const ATTEMPTS = attemptsKey('m09-electro-pneumatics');

const stateText = (s: Readonly<Record<string, boolean | undefined>>) =>
  Object.entries(s)
    .map(([coil, v]) => `${coil} ${v ? L.on : L.off}`)
    .join(', ');

/**
 * Circuit-design tasks checked by simulation (course-alignment §5.11). The
 * result is saved as an attempt of this laboratory, so it appears in the report
 * and progress.
 */
export function DesignTasks({ ladder }: { readonly ladder: Ladder }) {
  const attempts = useStoredValue<Attempt[]>(ATTEMPTS, []);
  const [taskId, setTaskId] = useState(LADDER_TASKS[0]?.id ?? '');
  const [result, setResult] = useState<LadderTaskResult | null>(null);
  const task = LADDER_TASKS.find((t) => t.id === taskId);
  const text = L.designTasks[taskId];

  function check() {
    if (!task) return;
    const r = checkLadderTask(ladder, task);
    setResult(r);
    attempts.update((list) => [
      ...list,
      {
        questionId: `m09.design.${task.id}`,
        seed: null,
        answerGiven: JSON.stringify(ladder),
        correct: r.passed,
        answeredAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="space-y-3" data-testid="design-tasks">
      <p className="text-sm text-navy-700">{L.designIntro}</p>
      <label className="block text-sm font-medium text-navy-800">
        {L.designTask}
        <select
          className={selectClass}
          value={taskId}
          onChange={(e) => {
            setTaskId(e.target.value);
            setResult(null);
          }}
        >
          {LADDER_TASKS.map((t) => (
            <option key={t.id} value={t.id}>
              {L.designTasks[t.id]?.title ?? t.id}
            </option>
          ))}
        </select>
      </label>
      {text ? <p className="text-sm text-navy-900">{text.brief}</p> : null}
      <Button onClick={check}>{L.designCheck}</Button>
      {result ? (
        <div role="status" className="space-y-1 text-sm" data-testid="design-result">
          <p className={`font-semibold ${result.passed ? 'text-navy-900' : 'text-status-danger'}`}>
            {result.passed ? L.designPass : L.designFail}
          </p>
          {!result.indirectOk ? <p className="text-status-danger">{L.designIndirect}</p> : null}
          {!result.stable ? <p className="text-status-danger">{L.designUnstable}</p> : null}
          <ol className="space-y-0.5">
            {result.steps.map((s, i) => (
              <li key={i}>
                {s.ok ? '✓' : '✗'}{' '}
                {L.designStep
                  .replace('{pressed}', s.pressed.join(' + ') || L.designNone)
                  .replace('{expected}', stateText(s.expected))
                  .replace('{got}', stateText(s.got))}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
