/**
 * Marking for the assessment engine (FR-10). Pure functions; the UI only displays
 * the result. Tolerances follow docs/course-alignment.md §5.11: relative ±2 % on
 * derived values unless a question states otherwise.
 */
import type {
  CalculationInstance,
  MultipleChoiceQuestion,
  SequenceAnswer,
  ChainInstance,
  PartResult,
  SequenceInstance,
  TableInstance,
} from './types';

export interface MarkResult {
  readonly correct: boolean;
  /** Feedback shown immediately. */
  readonly feedback: string;
  /** Worked explanation, always shown after an answer. */
  readonly explanation: string;
}

/**
 * Parse a typed number. Accepts spaces and thousands commas ("1,671.1"),
 * a leading +, and e-notation. Returns NaN for anything else.
 */
export function parseAnswer(text: string): number {
  const cleaned = text
    .trim()
    .replace(/\s+/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** True when `given` is within the relative tolerance of `answer` (absolute 1e−9 near zero). */
export function withinTolerance(given: number, answer: number, relativeTolerance: number): boolean {
  if (!Number.isFinite(given)) return false;
  const scale = Math.max(Math.abs(answer), 1e-9);
  return Math.abs(given - answer) <= relativeTolerance * scale + 1e-12;
}

/** Number shown back to the student, to 4 significant figures. */
function show(v: number): string {
  return String(Number(v.toPrecision(4)));
}

export function markCalculation(text: string, instance: CalculationInstance): MarkResult {
  const given = parseAnswer(text);
  if (Number.isNaN(given)) {
    return {
      correct: false,
      feedback: 'Enter a number, without the unit.',
      explanation: instance.explanation,
    };
  }
  const pct = instance.relativeTolerance * 100;
  if (withinTolerance(given, instance.answer, instance.relativeTolerance)) {
    return {
      correct: true,
      feedback: `Correct: ${show(instance.answer)} ${instance.unit} (within ±${pct} %).`,
      explanation: instance.explanation,
    };
  }
  const ratio = given / instance.answer;
  let hint = '';
  const near = (target: number) =>
    Number.isFinite(ratio) && Math.abs(ratio / target - 1) <= instance.relativeTolerance;
  if (near(1000) || near(0.001)) hint = ' Check the unit: you may be out by a factor of 1000.';
  else if (near(30 / Math.PI) || near(Math.PI / 30)) {
    hint = ' Check whether the answer is wanted in rad/s or rpm.';
  } else if (ratio < 0 && Math.abs(Math.abs(ratio) - 1) < instance.relativeTolerance) {
    hint = ' Check the sign.';
  }
  return {
    correct: false,
    feedback: `Not correct. The answer is ${show(instance.answer)} ${instance.unit}.${hint}`,
    explanation: instance.explanation,
  };
}

export function markChoice(question: MultipleChoiceQuestion, choiceId: string): MarkResult {
  const chosen = question.choices.find((c) => c.id === choiceId);
  if (!chosen) {
    return { correct: false, feedback: 'Choose an answer.', explanation: question.explanation };
  }
  if (choiceId === question.correctChoiceId) {
    return { correct: true, feedback: 'Correct.', explanation: question.explanation };
  }
  const right = question.choices.find((c) => c.id === question.correctChoiceId);
  return {
    correct: false,
    feedback: `Not correct.${chosen.explanationIfChosen ? ` ${chosen.explanationIfChosen}` : ''} The correct answer is: ${right?.text ?? ''}`,
    explanation: question.explanation,
  };
}

/** Cell symbol as written in the course tables. */
export function sequenceCellText(v: number, kind: SequenceInstance['cellKind']): string {
  if (kind === 'on-off') return v ? 'on' : 'off';
  return v > 0 ? '+' : v < 0 ? '−' : '0';
}

/** The correct table as text, one row per line: "Step 1: A on, B off, C off — 0°". */
export function sequenceAnswerText(instance: SequenceInstance): string {
  return instance.answer
    .map(
      (row, r) =>
        `Step ${r + 1}: ${row
          .map(
            (v, j) => `${instance.phaseLabels[j] ?? ''} ${sequenceCellText(v, instance.cellKind)}`,
          )
          .join(', ')} — ${show(instance.angles[r] ?? Number.NaN)}°`,
    )
    .join('\n');
}

/**
 * Mark a phase-sequence table: every cell exactly, every angle within the
 * instance tolerance (course-alignment §5.11). Feedback names the wrong rows.
 */
export function markSequence(given: SequenceAnswer, instance: SequenceInstance): MarkResult {
  const wrongCells: number[] = [];
  const wrongAngles: number[] = [];
  instance.answer.forEach((row, r) => {
    const g = given.cells[r];
    if (!g || row.some((v, j) => (g[j] ?? 0) !== v)) wrongCells.push(r + 1);
    const a = parseAnswer(given.angles[r] ?? '');
    const target = instance.angles[r] ?? Number.NaN;
    if (!(Math.abs(a - target) <= instance.angleTolerance + 1e-9)) wrongAngles.push(r + 1);
  });
  const explanation = [instance.explanation, sequenceAnswerText(instance)].join('\n');
  if (wrongCells.length === 0 && wrongAngles.length === 0) {
    return { correct: true, feedback: 'Correct: every step and angle matches.', explanation };
  }
  const parts: string[] = [];
  if (wrongCells.length > 0) parts.push(`phase pattern wrong in step ${wrongCells.join(', ')}`);
  if (wrongAngles.length > 0) {
    parts.push(`angle wrong (±${instance.angleTolerance}°) in step ${wrongAngles.join(', ')}`);
  }
  return { correct: false, feedback: `Not correct: ${parts.join('; ')}.`, explanation };
}

/** An empty answer for a sequence instance: every phase off, no angles. */
export function emptySequenceAnswer(instance: SequenceInstance): SequenceAnswer {
  return {
    cells: instance.answer.map((row) => row.map(() => 0)),
    angles: instance.answer.map(() => ''),
  };
}

/** Mark a numeric table: each row within max(absolute, relative·|answer|). */
export function markTable(given: readonly string[], instance: TableInstance): MarkResult {
  const wrong: string[] = [];
  instance.rows.forEach((row, i) => {
    const v = parseAnswer(given[i] ?? '');
    const tol = Math.max(
      instance.absoluteTolerance,
      instance.relativeTolerance * Math.abs(row.answer),
    );
    if (!(Math.abs(v - row.answer) <= tol + 1e-12)) wrong.push(row.key);
  });
  const answers = instance.rows.map((r) => `${r.key}: ${show(r.answer)}`).join(', ');
  const explanation = `${instance.explanation} Correct values — ${answers}.`;
  if (wrong.length === 0) {
    return { correct: true, feedback: 'Correct: every value is within tolerance.', explanation };
  }
  return {
    correct: false,
    feedback: `Not correct: check the value${wrong.length > 1 ? 's' : ''} at ${wrong.join(', ')}.`,
    explanation,
  };
}

export interface ChainMark extends MarkResult {
  readonly parts: readonly PartResult[];
}

/**
 * Mark a numeric chain with error carried forward: part i is correct if it is
 * within tolerance of the true value, or "ecf" if it is within tolerance of the
 * value that follows from the student's own earlier answers. The whole answer
 * counts as correct when every part is correct or ecf.
 */
export function markChain(given: readonly string[], instance: ChainInstance): ChainMark {
  const values = given.map((g) => parseAnswer(g));
  const parts: PartResult[] = instance.parts.map((part, i) => {
    const v = values[i] ?? Number.NaN;
    if (withinTolerance(v, part.answer, part.relativeTolerance)) return 'correct';
    const earlier = values.slice(0, i);
    if (earlier.every(Number.isFinite)) {
      const carried = part.compute(earlier);
      if (Number.isFinite(carried) && withinTolerance(v, carried, part.relativeTolerance))
        return 'ecf';
    }
    return 'wrong';
  });
  const describe = (r: PartResult, i: number) => {
    const label = instance.parts[i]?.label ?? '';
    if (r === 'correct') return `${label} correct`;
    if (r === 'ecf') return `${label} correct for your earlier answers (error carried forward)`;
    return `${label} not correct (${show(instance.parts[i]?.answer ?? Number.NaN)} ${instance.parts[i]?.unit ?? ''})`;
  };
  const correct = parts.every((r) => r !== 'wrong');
  return {
    correct,
    parts,
    feedback: `${correct ? 'Accepted' : 'Not all parts accepted'}: ${parts.map(describe).join('; ')}.`,
    explanation: instance.explanation,
  };
}
