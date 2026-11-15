/**
 * M06 question bank (original to VADL). Keys are computed by the sim-core
 * functions verified in tests/reference/transmission.test.ts.
 */
import { mulberry32, pick, randInt, randStep } from '@/features/assessment/rng';
import type {
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  beltPower,
  beltSpeed,
  liftingPulley,
  machineEfficiency,
  mechanicalAdvantage,
  mmToM,
  outputSpeed,
  rpmToRadPerSec,
  stageDirection,
  stageRatio,
  velocityRatio,
} from '@/sim-core';

const MODULE = 'm06-transmission';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const idlerMcq: MultipleChoiceQuestion = {
  id: 'm06.mcq.idler',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m06.lo1'],
  stem: 'An idler gear is placed between a driver and a driven gear. What does it change?',
  choices: [
    { id: 'a', text: 'Only the direction of the driven gear; the ratio is unchanged' },
    {
      id: 'b',
      text: 'The gear ratio, in proportion to its number of teeth',
      explanationIfChosen:
        'Its teeth cancel out: G = (T_idler/T_driver)(T_driven/T_idler) = T_driven/T_driver.',
    },
    {
      id: 'c',
      text: 'Both the ratio and the direction',
      explanationIfChosen: 'The ratio depends only on the driver and driven gears.',
    },
    {
      id: 'd',
      text: 'Nothing at all',
      explanationIfChosen: 'Without the idler the driven gear would turn the other way.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Each external mesh reverses the direction, so with an idler the driven gear turns the same way as the driver. The idler teeth cancel in the ratio (Tutorial 4 Q4).',
};

const crossedMcq: MultipleChoiceQuestion = {
  id: 'm06.mcq.crossed',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m06.lo2'],
  stem: 'A driver pulley turns clockwise. In which direction does the driven pulley turn with an open belt, and with a crossed belt?',
  choices: [
    { id: 'a', text: 'Open belt: clockwise. Crossed belt: anticlockwise' },
    {
      id: 'b',
      text: 'Open belt: anticlockwise. Crossed belt: clockwise',
      explanationIfChosen: 'That is the gear rule; an open belt keeps the direction.',
    },
    {
      id: 'c',
      text: 'Both clockwise',
      explanationIfChosen: 'Crossing the belt reverses the driven pulley.',
    },
    {
      id: 'd',
      text: 'Both anticlockwise',
      explanationIfChosen:
        'An open belt wraps both pulleys the same way, so they turn the same way.',
    },
  ],
  correctChoiceId: 'a',
  explanation: 'An open belt (like a chain) keeps the direction; a crossed belt reverses it.',
};

const wormMcq: MultipleChoiceQuestion = {
  id: 'm06.mcq.worm',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m06.lo1'],
  stem: 'Why is a worm and wheel often used to drive a winch or a lift gate?',
  choices: [
    {
      id: 'a',
      text: 'It gives a large reduction in one stage and is usually self-locking, so the load cannot drive it backwards',
    },
    {
      id: 'b',
      text: 'It is the most efficient gear type',
      explanationIfChosen: 'Worm gears have high sliding friction and are relatively inefficient.',
    },
    {
      id: 'c',
      text: 'It keeps the shafts parallel',
      explanationIfChosen: 'Worm and wheel shafts are at right angles.',
    },
    {
      id: 'd',
      text: 'It increases the output speed',
      explanationIfChosen: 'A worm drive is a large speed reduction (20:1 to 300:1).',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Ratios of 20:1 to 300:1 in one stage, and the friction normally prevents the wheel from turning the worm, so the load holds itself.',
};

const slipTs: MultipleChoiceQuestion = {
  id: 'm06.ts.belt-slip',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m06.lo2'],
  stem: 'A V-belt conveyor drive squeals and the conveyor slows down when it is fully loaded, although the motor runs at full speed. What is the most likely cause?',
  choices: [
    { id: 'a', text: 'The belt is slipping: tension too low or load too high for the belt' },
    {
      id: 'b',
      text: 'The pulley ratio has changed',
      explanationIfChosen: 'The diameters are fixed; only slip makes the driven pulley lag.',
    },
    {
      id: 'c',
      text: 'The belt is crossed',
      explanationIfChosen:
        'A crossed belt would reverse the conveyor, not slow it, and is not used with V-belts.',
    },
    {
      id: 'd',
      text: 'The motor direction is reversed',
      explanationIfChosen: 'The conveyor still moves the right way, only slower.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Belts drive by friction. When (T1 − T2) needed for the load exceeds what the friction can carry, the belt slips (which protects the machine from overload). Re-tension the belt with the adjuster or reduce the load; a timing belt or chain does not slip.',
};

const pairCalc: CalculationQuestion = {
  id: 'm06.calc.pair',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m06.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const driver = pick(rng, [12, 15, 16, 20, 24, 25, 30, 40, 60]);
    const driven = pick(rng, [20, 30, 36, 40, 45, 48, 60, 75, 80]);
    const n = pick(rng, [60, 100, 120, 150, 200, 300, 400, 600]);
    const g = stageRatio(driver, driven);
    const out = outputSpeed(n, g);
    return {
      stem: `A ${driver}T driver gear turning at ${n} rpm meshes with a ${driven}T gear. Find the speed of the driven gear, in rpm.`,
      answer: out,
      unit: 'rpm',
      relativeTolerance: TOL,
      explanation: `G = T_driven/T_driver = ${driven}/${driver} = ${f(g)}. N_driven = N_driver/G = ${n}/${f(g)} = ${f(out)} rpm, in the opposite direction.`,
    };
  },
};

const compoundCalc: CalculationQuestion = {
  id: 'm06.calc.compound',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m06.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const a = pick(rng, [20, 30, 40, 60, 80, 120]);
    const b = pick(rng, [15, 20, 40, 60]);
    const c = pick(rng, [30, 40, 50, 60, 80]);
    const d = pick(rng, [10, 15, 20, 25, 40]);
    const n = pick(rng, [20, 30, 50, 60, 100]);
    const cw = rng() < 0.5;
    const sign = cw ? 1 : -1;
    const s1 = (stageDirection('gear') * sign * n) / stageRatio(a, b);
    const s2 = outputSpeed(stageDirection('gear') * s1, stageRatio(c, d));
    return {
      stem: `Gear A (${a}T) turns at ${n} rpm ${cw ? 'clockwise' : 'anticlockwise'} and drives gear B (${b}T). Gear C (${c}T) is fixed on B's shaft and drives gear D (${d}T). Find the speed of D in rpm, positive if D turns clockwise and negative if anticlockwise.`,
      answer: s2,
      unit: 'rpm',
      relativeTolerance: TOL,
      explanation: `N_B = N_C = ${n} × ${a}/${b} = ${f(Math.abs(s1))} rpm (reversed). N_D = ${f(Math.abs(s1))} × ${c}/${d} = ${f(Math.abs(s2))} rpm. Two external meshes reverse twice, so D turns the same way as A: ${s2 > 0 ? 'clockwise' : 'anticlockwise'}.`,
    };
  },
};

const beltSpeedCalc: CalculationQuestion = {
  id: 'm06.calc.belt-speed',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m06.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const d1 = pick(rng, [50, 80, 100, 120, 150, 200]);
    const d2 = pick(rng, [100, 150, 200, 240, 300, 400, 600]);
    const n = pick(rng, [20, 60, 120, 300, 600, 1440]);
    const out = outputSpeed(n, stageRatio(d1, d2));
    return {
      stem: `A ${d1} mm driver pulley turning at ${n} rpm drives a ${d2} mm pulley by an open belt. Find the speed of the driven pulley, in rpm.`,
      answer: out,
      unit: 'rpm',
      relativeTolerance: TOL,
      explanation: `G = D_driven/D_driver = ${d2}/${d1} = ${f(d2 / d1)}. N = ${n}/${f(d2 / d1)} = ${f(out)} rpm, same direction (open belt).`,
    };
  },
};

const beltPowerCalc: CalculationQuestion = {
  id: 'm06.calc.belt-power',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m06.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const t2 = randStep(rng, 100, 400, 50);
    const t1 = t2 + randStep(rng, 100, 800, 50);
    const dmm = pick(rng, [100, 150, 200, 250, 300]);
    const n = pick(rng, [300, 600, 720, 960, 1440]);
    const v = beltSpeed(rpmToRadPerSec(n), mmToM(dmm) / 2);
    const pw = beltPower(t1, t2, v);
    return {
      stem: `A belt has a tight-side tension of ${t1} N and a slack-side tension of ${t2} N. It drives a ${dmm} mm diameter pulley at ${n} rpm. Find the power transmitted, in W.`,
      answer: pw,
      unit: 'W',
      relativeTolerance: TOL,
      explanation: `ω = 2π × ${n}/60 = ${f(rpmToRadPerSec(n))} rad/s; v = ω·r = ${f(v)} m/s; P = (T1 − T2)·v = ${t1 - t2} × ${f(v)} = ${f(pw)} W.`,
    };
  },
};

const liftEffortCalc: CalculationQuestion = {
  id: 'm06.calc.lift-effort',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m06.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const n = randInt(rng, 2, 6);
    const load = pick(rng, [60, 80, 100, 120, 150, 240, 300]);
    const l = liftingPulley(n, load, 1);
    return {
      stem: `An ideal (frictionless) pulley system has ${n} rope segments supporting a load of ${load} N. What effort is needed to lift the load, in N?`,
      answer: l.effort,
      unit: 'N',
      relativeTolerance: TOL,
      explanation: `Ideal MA = number of supporting segments = ${n}. Effort = load/MA = ${load}/${n} = ${f(l.effort)} N. The effort moves ${n} m for every 1 m the load rises (VR = ${n}).`,
    };
  },
};

const liftEfficiencyCalc: CalculationQuestion = {
  id: 'm06.calc.lift-efficiency',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m06.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const n = randInt(rng, 2, 6);
    const load = pick(rng, [100, 200, 300, 400, 500]);
    const effort = Number(((load / n) * randStep(rng, 1.1, 1.5, 0.05)).toFixed(1));
    const h = pick(rng, [0.5, 1, 2]);
    const ma = mechanicalAdvantage(load, effort);
    const vr = velocityRatio(n * h, h);
    const eta = machineEfficiency(ma, vr);
    return {
      stem: `A pulley system lifts a ${load} N load through ${h} m when an effort of ${effort} N moves ${f(n * h)} m. Find its efficiency, in %.`,
      answer: 100 * eta,
      unit: '%',
      relativeTolerance: TOL,
      explanation: `MA = load/effort = ${load}/${effort} = ${f(ma)}; VR = ${f(n * h)}/${h} = ${f(vr)}; η = MA/VR = ${f(100 * eta)} %. Friction makes MA smaller than VR.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm06.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'intermediate',
  outcomeIds: ['m06.lo2'],
  stem: 'Explain why belts can slip and when a timing belt or chain is used instead.',
  markingGuide: [
    'A flat or V-belt transmits power by friction; the torque it can carry is limited by the tension difference T1 − T2 the friction allows.',
    'Overload makes the belt slip (which can protect the machine), so the speed ratio is not exact.',
    'A timing belt or chain has teeth that engage the pulley or sprocket: no slip, a constant ratio.',
    'They are used where the speed ratio or timing must be exact, e.g. camshaft drives, positioning.',
  ],
};

export const M06_QUESTIONS: readonly Question[] = [
  idlerMcq,
  pairCalc,
  crossedMcq,
  beltSpeedCalc,
  liftEffortCalc,
  compoundCalc,
  wormMcq,
  beltPowerCalc,
  liftEfficiencyCalc,
  slipTs,
  explainQuestion,
];
