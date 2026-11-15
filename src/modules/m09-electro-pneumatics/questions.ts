/**
 * M09 question bank (original to VADL). Keys are computed by the sim-core
 * functions verified in tests/reference/fluid-power.test.ts.
 */
import { mulberry32, pick } from '@/features/assessment/rng';
import type {
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import { coilCurrent, coilPower, coilVoltage } from '@/sim-core';

const MODULE = 'm09-electro-pneumatics';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const indirectMcq: MultipleChoiceQuestion = {
  id: 'm09.mcq.indirect',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m09.lo1'],
  stem: 'In indirect control, what does the push button switch?',
  choices: [
    { id: 'a', text: 'A relay coil, whose contact then switches the solenoid' },
    { id: 'b', text: 'The solenoid coil directly', explanationIfChosen: 'That is direct control.' },
    {
      id: 'c',
      text: 'The compressed air to the cylinder',
      explanationIfChosen: 'In electro-pneumatics the button switches an electrical signal.',
    },
    {
      id: 'd',
      text: 'The 24 V power supply',
      explanationIfChosen: 'The supply stays on; the button switches one current path.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The button carries only the small relay-coil current; the relay contacts (rated higher) switch the solenoid and can switch several circuits at once.',
};

const latchMcq: MultipleChoiceQuestion = {
  id: 'm09.mcq.latch',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m09.lo2'],
  stem: 'In a latching circuit, the NC contact of the reset button S2 is in series with both the set button S1 and the K1 hold contact. What happens if S1 and S2 are pressed together?',
  choices: [
    { id: 'a', text: 'K1 stays off: reset is dominant' },
    {
      id: 'b',
      text: 'K1 switches on: set is dominant',
      explanationIfChosen: 'For dominant set, S2 must be in the hold branch only.',
    },
    {
      id: 'c',
      text: 'K1 chatters on and off',
      explanationIfChosen: 'The circuit is stable; S2 simply opens it.',
    },
    {
      id: 'd',
      text: 'The 24 V supply is short-circuited',
      explanationIfChosen: 'Contacts in series with a coil cannot short the supply.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With S2 (NC) in series with everything, pressing S2 opens the rung whatever S1 does: reset dominant, the safer choice for most machines.',
};

const powerFailMcq: MultipleChoiceQuestion = {
  id: 'm09.mcq.power-failure',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m09.lo1'],
  stem: 'A double-acting cylinder is controlled by a 5/2 single-solenoid valve with spring return. The 24 V supply fails while the cylinder is extended. What happens?',
  choices: [
    { id: 'a', text: 'The valve springs back and the cylinder retracts' },
    {
      id: 'b',
      text: 'The cylinder stays extended',
      explanationIfChosen: 'That happens with a double-solenoid (memory) valve.',
    },
    {
      id: 'c',
      text: 'The cylinder stops in mid-stroke',
      explanationIfChosen: 'The air supply is still on and the valve returns to rest.',
    },
    {
      id: 'd',
      text: 'The cylinder extends further',
      explanationIfChosen: 'It is already at its end.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A spring-return solenoid valve returns to its rest position when the coil loses power, so the cylinder goes to its rest position — chosen to be safe.',
};

const faultTs: MultipleChoiceQuestion = {
  id: 'm09.ts.sensor',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m09.lo4'],
  stem: 'In the sequence 1A1+ 2A1+ 1A1− 2A1−, cylinder 1A1 extends fully when S1 is pressed, but 2A1 never moves. The lamp of sensor 1B2 stays off. The air supply is normal. What is the most likely fault?',
  choices: [
    { id: 'a', text: 'Sensor 1B2 is defective or misadjusted' },
    {
      id: 'b',
      text: 'Push button S1 is defective',
      explanationIfChosen: '1A1 extended, so S1 works.',
    },
    {
      id: 'c',
      text: 'The 24 V supply has failed',
      explanationIfChosen: 'Then 1A1 would not have extended.',
    },
    {
      id: 'd',
      text: 'Solenoid 1M1 is defective',
      explanationIfChosen: '1M1 worked: 1A1 extended.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    '2A1 starts on the signal from 1B2. With 1A1 at its end and the 1B2 lamp off, the sensor (or its wiring or adjustment) is at fault.',
};

const currentCalc: CalculationQuestion = {
  id: 'm09.calc.coil-current',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m09.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const R = pick(rng, [24, 32, 48, 64, 96, 120]);
    const I = coilCurrent(24, R);
    return {
      stem: `A 24 V DC solenoid coil has a resistance of ${R} Ω. Find the current it draws, in A.`,
      answer: I,
      unit: 'A',
      relativeTolerance: TOL,
      explanation: `I = U/R = 24/${R} = ${f(I)} A (power ${f(coilPower(24, R))} W).`,
    };
  },
};

const powerCalc: CalculationQuestion = {
  id: 'm09.calc.coil-power',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m09.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const R = pick(rng, [24, 48, 72, 96]);
    const n = pick(rng, [2, 3, 4, 5]);
    const total = n * coilCurrent(24, R);
    return {
      stem: `Push button S1 switches ${n} solenoid coils of ${R} Ω each, in parallel, from 24 V DC. What current does S1 carry, in A? (Compare it with a push-button rating of 2 A.)`,
      answer: total,
      unit: 'A',
      relativeTolerance: TOL,
      explanation: `Each coil draws 24/${R} = ${f(coilCurrent(24, R))} A; ${n} coils draw ${f(total)} A. ${total > 2 ? 'This exceeds 2 A: use a relay (indirect control).' : 'This is within 2 A, but a relay would still protect the button.'}`,
    };
  },
};

const voltageCalc: CalculationQuestion = {
  id: 'm09.calc.coil-voltage',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m09.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const P = pick(rng, [0.5, 1, 1.2, 2]);
    const R = pick(rng, [290, 480, 580, 720]);
    const U = coilVoltage(P, R);
    return {
      stem: `A relay coil has a resistance of ${R} Ω and is rated at ${P} W. At what voltage does it draw its rated power, in V?`,
      answer: U,
      unit: 'V',
      relativeTolerance: TOL,
      explanation: `P = U²/R, so U = √(P·R) = √(${P} × ${R}) = ${f(U)} V.`,
    };
  },
};

export const M09_QUESTIONS: readonly Question[] = [
  indirectMcq,
  currentCalc,
  powerFailMcq,
  latchMcq,
  powerCalc,
  voltageCalc,
  faultTs,
];
