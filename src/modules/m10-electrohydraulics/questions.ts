/**
 * M10 question bank (original to VADL). Keys are computed by the sim-core
 * functions verified in tests/reference/fluid-power.test.ts.
 */
import { mulberry32, pick } from '@/features/assessment/rng';
import type {
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  annulusArea,
  backPressureForce,
  cm2ToM2,
  cm3ToM3,
  mmToM,
  pistonArea,
  cylinderSpeed,
  drivePower,
  litresPerMinToCubicMetresPerSec,
  loadPressure,
  mpaToPa,
  paToMpa,
  pumpFlow,
  cubicMetresPerSecToLitresPerMin,
} from '@/sim-core';

const MODULE = 'm10-electrohydraulics';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const reliefMcq: MultipleChoiceQuestion = {
  id: 'm10.mcq.relief',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m10.lo1'],
  stem: 'A hydraulic cylinder reaches the end of its stroke while the pump keeps running. Where does the pump flow go?',
  choices: [
    { id: 'a', text: 'Over the pressure-relief valve back to the tank, at the relief setting' },
    {
      id: 'b',
      text: 'Into the cylinder, which compresses the oil',
      explanationIfChosen: 'Oil is almost incompressible; the cylinder cannot take more.',
    },
    {
      id: 'c',
      text: 'Nowhere: the pump stops',
      explanationIfChosen: 'A fixed-displacement pump keeps delivering while it turns.',
    },
    {
      id: 'd',
      text: 'Through the non-return valve backwards',
      explanationIfChosen: 'A non-return valve blocks reverse flow.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The pressure rises to the relief setting, the valve opens and the whole flow returns to tank as heat. Power p·q is wasted, which is why a pump bypass is used at rest.',
};

const checkMcq: MultipleChoiceQuestion = {
  id: 'm10.mcq.check',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m10.lo1'],
  stem: 'Why is a non-return valve fitted between the pump and a cylinder holding a suspended load?',
  choices: [
    { id: 'a', text: 'So that the load cannot push the oil back through the pump when it stops' },
    {
      id: 'b',
      text: 'To increase the pump flow',
      explanationIfChosen: 'It only blocks reverse flow.',
    },
    {
      id: 'c',
      text: 'To set the lowering speed',
      explanationIfChosen: 'The flow control sets the speed.',
    },
    {
      id: 'd',
      text: 'To limit the system pressure',
      explanationIfChosen: 'That is the relief valve.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The non-return valve lets oil reach the cylinder but not flow back, so the load is held when the pump is off (Lab 4a Ex 1–2).',
};

const meterOutMcq: MultipleChoiceQuestion = {
  id: 'm10.mcq.meter-out',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m10.lo1'],
  stem: 'Why must the lowering speed of a suspended load be controlled by throttling the oil leaving the cylinder (meter-out)?',
  choices: [
    {
      id: 'a',
      text: 'The weight drives the piston; only a restriction on the outflow can hold it back',
    },
    {
      id: 'b',
      text: 'Meter-in uses less power',
      explanationIfChosen: 'The reason is control of a pulling load, not power.',
    },
    {
      id: 'c',
      text: 'The pump cannot run while lowering',
      explanationIfChosen: 'The pump may run; the issue is the load running away.',
    },
    {
      id: 'd',
      text: 'It doubles the force',
      explanationIfChosen: 'Throttling does not increase the force.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With meter-in, a pulling load would run ahead of the incoming oil (cavitation, uncontrolled fall). Meter-out builds a back pressure that balances the weight.',
};

const loadPressureCalc: CalculationQuestion = {
  id: 'm10.calc.load-pressure',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m10.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const F = pick(rng, [60, 90, 120, 150, 200, 250]);
    const A = pick(rng, [0.8, 1.2, 1.5, 2.0, 3.1]);
    const p = loadPressure(F, cm2ToM2(A));
    return {
      stem: `A weight of ${F} N hangs on a cylinder and is carried by the annulus area of ${A} cm². Find the load pressure, in MPa.`,
      answer: paToMpa(p),
      unit: 'MPa',
      relativeTolerance: TOL,
      explanation: `p = F/A = ${F} N / ${A} × 10⁻⁴ m² = ${f(p)} Pa = ${f(paToMpa(p))} MPa.`,
    };
  },
};

const speedCalc: CalculationQuestion = {
  id: 'm10.calc.speed',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m10.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const q = pick(rng, [1.5, 2, 2.2, 3, 4]);
    const A = pick(rng, [1.2, 2.0, 3.1, 4.9]);
    const s = pick(rng, [100, 150, 200, 250]);
    const v = cylinderSpeed(litresPerMinToCubicMetresPerSec(q), cm2ToM2(A));
    return {
      stem: `A pump delivers ${q} L/min to a cylinder area of ${A} cm². How long does a ${s} mm stroke take, in s?`,
      answer: mmToM(s) / v,
      unit: 's',
      relativeTolerance: TOL,
      explanation: `q = ${q}/60 000 = ${f(litresPerMinToCubicMetresPerSec(q))} m³/s; v = q/A = ${f(v)} m/s; t = s/v = ${f(mmToM(s) / v)} s.`,
    };
  },
};

const backPressureCalc: CalculationQuestion = {
  id: 'm10.calc.back-pressure',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m10.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [D, d] = pick(rng, [
      [32, 18],
      [40, 22],
      [50, 25],
      [63, 36],
    ] as const);
    const p1 = pick(rng, [2, 3, 4, 5]);
    const p2 = pick(rng, [0.3, 0.5, 0.6, 1]);
    const AP = pistonArea(mmToM(D));
    const APR = annulusArea(mmToM(D), mmToM(d));
    const F = backPressureForce(AP, mpaToPa(p1), APR, mpaToPa(p2));
    return {
      stem: `A cylinder of ${D} mm bore and ${d} mm rod extends with ${p1} MPa on the piston side and a back pressure of ${p2} MPa on the rod side. Find the net force, in N.`,
      answer: F,
      unit: 'N',
      relativeTolerance: TOL,
      explanation: `A_P = ${f(AP)} m², A_PR = ${f(APR)} m²; F = A_P·p1 − A_PR·p2 = ${f(AP * mpaToPa(p1))} − ${f(APR * mpaToPa(p2))} = ${f(F)} N.`,
    };
  },
};

const powerCalc: CalculationQuestion = {
  id: 'm10.calc.drive-power',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m10.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const p = pick(rng, [0.3, 1, 2, 3, 4, 5, 6]);
    const q = pick(rng, [2, 2.2, 3, 5]);
    const P = drivePower(mpaToPa(p), litresPerMinToCubicMetresPerSec(q), 0.7);
    return {
      stem: `A pump delivers ${q} L/min at ${p} MPa. With an overall efficiency of 0.7, what drive power does it need, in W?`,
      answer: P,
      unit: 'W',
      relativeTolerance: TOL,
      explanation: `Hydraulic power p·q = ${f(mpaToPa(p) * litresPerMinToCubicMetresPerSec(q))} W; drive power = p·q/η = ${f(P)} W.`,
    };
  },
};

const pumpCalc: CalculationQuestion = {
  id: 'm10.calc.pump-flow',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m10.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const V = pick(rng, [1.6, 2.8, 4, 6.5, 8]);
    const n = pick(rng, [960, 1390, 1450, 1680, 2800]);
    const q = cubicMetresPerSecToLitresPerMin(pumpFlow(cm3ToM3(V), n / 60));
    return {
      stem: `A gear pump displaces ${V} cm³ per revolution and turns at ${n} rpm. Find its theoretical flow, in L/min.`,
      answer: q,
      unit: 'L/min',
      relativeTolerance: TOL,
      explanation: `q = V·n = ${V} cm³ × ${n} min⁻¹ = ${f(V * n)} cm³/min = ${f(q)} L/min.`,
    };
  },
};

export const M10_QUESTIONS: readonly Question[] = [
  reliefMcq,
  loadPressureCalc,
  pumpCalc,
  checkMcq,
  speedCalc,
  powerCalc,
  meterOutMcq,
  backPressureCalc,
];
