/**
 * M08 question bank (original to VADL). Keys are computed by the sim-core
 * functions verified in tests/reference/fluid-power.test.ts.
 */
import { mulberry32, pick } from '@/features/assessment/rng';
import type {
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  annulusArea,
  barToPa,
  effectiveForce,
  mmToM,
  pistonArea,
  theoreticalForce,
} from '@/sim-core';

const MODULE = 'm08-pneumatics';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const shuttleMcq: MultipleChoiceQuestion = {
  id: 'm08.mcq.shuttle',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m08.lo1'],
  stem: 'Which valve gives an output signal when either of two inputs is pressurised?',
  choices: [
    { id: 'a', text: 'Shuttle valve' },
    {
      id: 'b',
      text: 'Dual-pressure valve',
      explanationIfChosen: 'The dual-pressure valve needs both inputs (AND).',
    },
    {
      id: 'c',
      text: 'One-way flow control valve',
      explanationIfChosen: 'It throttles flow; it does not combine signals.',
    },
    {
      id: 'd',
      text: 'Quick-exhaust valve',
      explanationIfChosen: 'It speeds up exhausting; it is not a logic element.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The shuttle valve is the pneumatic OR: its ball closes the unpressurised input so the signal cannot escape through it.',
};

const memoryMcq: MultipleChoiceQuestion = {
  id: 'm08.mcq.memory',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m08.lo1', 'm08.lo3'],
  stem: 'A double-acting cylinder is controlled by a double-pilot 5/2 valve. The extend signal is applied briefly and removed. What does the cylinder do?',
  choices: [
    { id: 'a', text: 'It extends fully and stays extended until a retract signal arrives' },
    {
      id: 'b',
      text: 'It extends only while the signal is present',
      explanationIfChosen: 'That is a single-pilot valve with spring return.',
    },
    {
      id: 'c',
      text: 'It stops where it is when the signal is removed',
      explanationIfChosen: 'A 5/2 valve keeps supplying the cap side; the piston continues.',
    },
    {
      id: 'd',
      text: 'It returns immediately',
      explanationIfChosen: 'There is no spring to return the valve.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A double-pilot valve has no spring: it keeps its last position (memory) until the opposite pilot signal arrives.',
};

const indirectMcq: MultipleChoiceQuestion = {
  id: 'm08.mcq.indirect',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m08.lo1'],
  stem: 'Why is indirect control used for larger cylinders?',
  choices: [
    {
      id: 'a',
      text: 'A small signal valve pilots a larger final control valve that can pass the large air flow',
    },
    {
      id: 'b',
      text: 'It increases the supply pressure',
      explanationIfChosen: 'The pressure is set by the regulator.',
    },
    {
      id: 'c',
      text: 'It removes the need for a cylinder',
      explanationIfChosen: 'The cylinder is still the actuator.',
    },
    {
      id: 'd',
      text: 'It makes the cylinder single-acting',
      explanationIfChosen: 'Indirect control works with either cylinder type.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    "The operator's push button or selector need only switch a small pilot signal; the main valve, sized for the cylinder, switches the main flow.",
};

const throttleTs: MultipleChoiceQuestion = {
  id: 'm08.ts.throttle',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m08.lo4'],
  stem: 'A double-acting cylinder slows down noticeably whenever its load increases, although the regulator pressure is steady. The flow controls are fitted to throttle the air going into the cylinder. What should be changed?',
  choices: [
    { id: 'a', text: 'Refit the one-way flow controls to throttle the exhaust air (meter-out)' },
    {
      id: 'b',
      text: 'Raise the pressure above 6 bar',
      explanationIfChosen:
        'The equipment is limited to 6 bar, and the cause is the throttling method.',
    },
    {
      id: 'c',
      text: 'Replace the 5/2 valve by a 3/2 valve',
      explanationIfChosen: 'A double-acting cylinder needs a 5/2 (or two 3/2) valve.',
    },
    {
      id: 'd',
      text: 'Open the flow controls fully',
      explanationIfChosen: 'That removes speed control altogether.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With supply-air throttling the cap pressure follows the load, so the flow — and the speed — change with load. Exhaust-air throttling holds the piston between two air cushions and gives a steadier speed (Festo recommends it for double-acting cylinders).',
};

const forceCalc: CalculationQuestion = {
  id: 'm08.calc.force',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m08.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const d = pick(rng, [20, 25, 32, 40, 50, 63]);
    const bar = pick(rng, [3, 4, 5, 6]);
    const fth = theoreticalForce(barToPa(bar), pistonArea(mmToM(d)));
    return {
      stem: `Find the theoretical extend force of a cylinder with a ${d} mm bore at ${bar} bar (no friction), in N.`,
      answer: fth,
      unit: 'N',
      relativeTolerance: TOL,
      explanation: `A = π × (${d / 1000} m)²/4 = ${f(pistonArea(mmToM(d)))} m²; F = p·A = ${bar * 1e5} Pa × A = ${f(fth)} N.`,
    };
  },
};

const singleCalc: CalculationQuestion = {
  id: 'm08.calc.single-acting',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m08.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const d = pick(rng, [16, 20, 25, 32]);
    const bar = pick(rng, [4, 5, 6]);
    const spring = pick(rng, [10, 13.6, 18, 25]);
    const F = effectiveForce(barToPa(bar), pistonArea(mmToM(d)), 0.1, spring);
    return {
      stem: `A single-acting cylinder has a ${d} mm bore and a ${spring} N return spring. Taking friction as 10 % of the theoretical force, find its effective extend force at ${bar} bar, in N.`,
      answer: F,
      unit: 'N',
      relativeTolerance: TOL,
      explanation: `F_th = p·A = ${f(theoreticalForce(barToPa(bar), pistonArea(mmToM(d))))} N; F_eff = 0.9 × F_th − ${spring} = ${f(F)} N.`,
    };
  },
};

const retractCalc: CalculationQuestion = {
  id: 'm08.calc.retract',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m08.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [d, r] = pick(rng, [
      [20, 8],
      [25, 10],
      [32, 12],
      [40, 16],
      [50, 20],
    ] as const);
    const bar = pick(rng, [4, 5, 6]);
    const F = effectiveForce(barToPa(bar), annulusArea(mmToM(d), mmToM(r)), 0.1);
    return {
      stem: `A double-acting cylinder has a ${d} mm bore and a ${r} mm piston rod. With 10 % friction, find the effective retract force at ${bar} bar, in N.`,
      answer: F,
      unit: 'N',
      relativeTolerance: TOL,
      explanation: `Annulus A′ = π(D² − d²)/4 = ${f(annulusArea(mmToM(d), mmToM(r)))} m²; F = 0.9 × p × A′ = ${f(F)} N — smaller than the extend force because the rod takes up area.`,
    };
  },
};

const pressureCalc: CalculationQuestion = {
  id: 'm08.calc.pressure',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m08.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const d = pick(rng, [32, 40, 50, 63]);
    const load = pick(rng, [300, 400, 500, 600, 800]);
    const A = pistonArea(mmToM(d));
    // F_eff = 0.9·p·A = load  →  p = load/(0.9·A); answer in bar from sim-core functions.
    const pPa = load / effectiveForce(1, A, 0.1);
    return {
      stem: `What working pressure, in bar, does a ${d} mm bore cylinder need to push a load of ${load} N, with friction 10 % of the theoretical force?`,
      answer: pPa / barToPa(1),
      unit: 'bar',
      relativeTolerance: TOL,
      explanation: `0.9·p·A = F, so p = F/(0.9·A) = ${load}/(0.9 × ${f(A)}) = ${f(pPa)} Pa = ${f(pPa / 1e5)} bar.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm08.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'intermediate',
  outcomeIds: ['m08.lo4'],
  stem: 'Explain why exhaust-air (meter-out) throttling is preferred for controlling the speed of a double-acting cylinder.',
  markingGuide: [
    'The piston is held between two air cushions: the supply side at full pressure, the exhaust side throttled.',
    'The speed is set by how fast the exhaust air can escape, so it changes little with the load.',
    'With supply-air throttling the speed depends on the load and the piston can jerk (stick-slip).',
    'Supply-air throttling is used for single-acting cylinders, which have no exhaust on the driven side.',
  ],
};

export const M08_QUESTIONS: readonly Question[] = [
  shuttleMcq,
  forceCalc,
  indirectMcq,
  singleCalc,
  retractCalc,
  memoryMcq,
  pressureCalc,
  throttleTs,
  explainQuestion,
];
