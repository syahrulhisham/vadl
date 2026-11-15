/**
 * M01 question bank (thin version, decision D9). Original questions written for
 * VADL; none is copied from course examinations. Calculation answers are
 * computed by the sim-core equation functions verified in tests/reference, so the
 * marking key always equals the engineering model.
 *
 * Outcome ids refer to M01_OUTCOMES in content.en.ts (provisional, D2).
 */
import { mulberry32, randStep, pick } from '@/features/assessment/rng';
import type {
  ChainQuestion,
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  converterAverageVoltage,
  degToRad,
  developedTorque,
  fieldCurrent,
  peakFromRms,
  radPerSecToRpm,
  startingResistance,
  steadyStateSeparate,
} from '@/sim-core';

const MODULE = 'm01-dc-motor';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const backEmfMcq: MultipleChoiceQuestion = {
  id: 'm01.mcq.back-emf',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m01.lo1'],
  stem: 'In a separately excited DC motor, what does the back-emf Eg depend on?',
  choices: [
    {
      id: 'a',
      text: 'The armature resistance and the armature current only',
      explanationIfChosen: 'Ia·Ra is the resistive voltage drop, not the back-emf.',
    },
    { id: 'b', text: 'The motor constant, the field current and the speed (Eg = Kv·If·ω)' },
    {
      id: 'c',
      text: 'The load torque only',
      explanationIfChosen: 'Load torque sets the armature current, not Eg directly.',
    },
    {
      id: 'd',
      text: 'The supply voltage only',
      explanationIfChosen: 'Eg equals Va − Ia·Ra, so it is less than Va whenever current flows.',
    },
  ],
  correctChoiceId: 'b',
  explanation:
    'The rotating armature cuts the field flux. The induced voltage is proportional to flux (set by If) and speed: Eg = Kv·If·ω.',
};

const startingMcq: MultipleChoiceQuestion = {
  id: 'm01.mcq.starting',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m01.lo2'],
  stem: 'Why is a starting resistance often placed in series with the armature of a large DC motor?',
  choices: [
    {
      id: 'a',
      text: 'At standstill Eg = 0, so only R limits the current; without Rst the current would be Va/Ra',
    },
    {
      id: 'b',
      text: 'To increase the final running speed',
      explanationIfChosen: 'Extra armature resistance lowers the speed for a given load.',
    },
    {
      id: 'c',
      text: 'To strengthen the field at starting',
      explanationIfChosen:
        'The starting resistance is in the armature circuit; it does not change If.',
    },
    {
      id: 'd',
      text: 'To reduce iron losses',
      explanationIfChosen: 'Iron losses are not affected by a series resistor.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With the rotor at rest there is no back-emf, so Ia = Va/(Ra + Rst). Rst is cut out as the motor speeds up and Eg rises.',
};

const fieldWeakeningMcq: MultipleChoiceQuestion = {
  id: 'm01.mcq.field-weakening',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m01.lo3'],
  stem: 'A separately excited motor drives a constant-torque load. The field current is reduced while Va stays the same. What happens at the new steady state?',
  choices: [
    { id: 'a', text: 'Speed rises and armature current rises' },
    {
      id: 'b',
      text: 'Speed falls and armature current falls',
      explanationIfChosen: 'Lower flux means more speed is needed to make the same Eg.',
    },
    {
      id: 'c',
      text: 'Speed rises and armature current falls',
      explanationIfChosen:
        'With less flux, more current is needed to produce the same torque (Td = Kv·If·Ia).',
    },
    {
      id: 'd',
      text: 'Nothing changes',
      explanationIfChosen: 'Both Eg and Td depend on If.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Td = Kv·If·Ia: with smaller If, Ia must rise to carry the same load. Eg = Va − Ia·Ra ≈ Va, and ω = Eg/(Kv·If) rises as If falls. This is control above base speed.',
};

const seriesMcq: MultipleChoiceQuestion = {
  id: 'm01.mcq.series-no-load',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m01.lo1'],
  stem: 'Why must a series DC motor never be run without a mechanical load?',
  choices: [
    {
      id: 'a',
      text: 'As load falls, armature current and flux fall, so speed rises to dangerous values',
    },
    {
      id: 'b',
      text: 'Its field would overheat',
      explanationIfChosen: 'At light load the series field current is small, not large.',
    },
    {
      id: 'c',
      text: 'It cannot start without load',
      explanationIfChosen: 'A series motor has a very high starting torque.',
    },
    {
      id: 'd',
      text: 'The back-emf becomes larger than the supply voltage',
      explanationIfChosen: 'Eg stays below Va while it is motoring.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'In a series motor the field current is the armature current. Light load means small Ia, small flux, and the speed needed to make Eg ≈ Va becomes very large.',
};

const dualMcq: MultipleChoiceQuestion = {
  id: 'm01.mcq.dual-converter',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m01.lo4'],
  stem: 'Which single-phase converter lets a DC drive operate in all four quadrants?',
  choices: [
    {
      id: 'a',
      text: 'Semi-converter',
      explanationIfChosen:
        'A semi-converter gives positive voltage and current only (one quadrant).',
    },
    {
      id: 'b',
      text: 'Full converter',
      explanationIfChosen:
        'A full converter can reverse voltage but not current (two quadrants) unless the field or armature is reversed.',
    },
    { id: 'c', text: 'Dual converter' },
    {
      id: 'd',
      text: 'Half-wave converter',
      explanationIfChosen: 'A half-wave converter with a freewheeling diode is one-quadrant.',
    },
  ],
  correctChoiceId: 'c',
  explanation:
    'A dual converter is two full converters connected back to back: one carries positive and one negative armature current, and each can reverse its voltage.',
};

const faultMcq: MultipleChoiceQuestion = {
  id: 'm01.ts.weak-field',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m01.lo3'],
  stem: 'A shunt motor on its normal supply runs much faster than its rating and draws a high armature current at normal load. The armature resistance measures correctly. What is the most likely fault?',
  choices: [
    { id: 'a', text: 'High resistance or a poor connection in the field circuit (weak field)' },
    {
      id: 'b',
      text: 'Supply voltage too low',
      explanationIfChosen: 'Low Va would reduce speed, not raise it.',
    },
    {
      id: 'c',
      text: 'Mechanical load too high',
      explanationIfChosen: 'More load would slow the motor slightly, not overspeed it.',
    },
    {
      id: 'd',
      text: 'Short-circuited starting resistor',
      explanationIfChosen:
        'That affects starting current only; running speed is unchanged once Rst is cut out.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'High speed with high current at normal load is the signature of low flux: ω = Eg/(Kv·If) rises and Ia = Td/(Kv·If) rises. Check the field circuit continuity and field current.',
};

const speedCalc: CalculationQuestion = {
  id: 'm01.calc.speed',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m01.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const va = randStep(rng, 180, 240, 10);
    const ra = randStep(rng, 0.2, 0.8, 0.05);
    const k = randStep(rng, 0.8, 1.6, 0.1);
    const tl = randStep(rng, 10, 40, 2);
    const { ia, omega } = steadyStateSeparate(va, ra, k, tl, 0);
    return {
      stem: `A separately excited DC motor has Ra = ${f(ra)} Ω and Kv·If = ${f(k)} V·s/rad. It is supplied at Va = ${f(va)} V and drives a constant load of ${f(tl)} N·m. Neglect friction. Find the steady-state speed in rpm.`,
      answer: radPerSecToRpm(omega),
      unit: 'rpm',
      relativeTolerance: TOL,
      explanation: `Ia = TL/(Kv·If) = ${f(tl)}/${f(k)} = ${f(ia)} A. Eg = Va − Ia·Ra = ${f(va)} − ${f(ia)} × ${f(ra)} = ${f(va - ia * ra)} V. ω = Eg/(Kv·If) = ${f(omega)} rad/s = ${f(radPerSecToRpm(omega))} rpm.`,
    };
  },
};

const torqueCalc: CalculationQuestion = {
  id: 'm01.calc.torque',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m01.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const kv = randStep(rng, 0.8, 1.8, 0.1);
    const vf = pick(rng, [110, 180, 220, 240]);
    const rf = pick(rng, [110, 150, 200, 220, 240]);
    const ia = randStep(rng, 10, 60, 5);
    const ifield = fieldCurrent(vf, rf);
    const td = developedTorque(kv, ifield, ia);
    return {
      stem: `A separately excited DC motor has Kv = ${f(kv)} V/(A·rad/s). Its field is supplied at ${vf} V through a field resistance of ${rf} Ω. Find the developed torque when Ia = ${ia} A, in N·m.`,
      answer: td,
      unit: 'N·m',
      relativeTolerance: TOL,
      explanation: `If = Vf/Rf = ${vf}/${rf} = ${f(ifield)} A. Td = Kv·If·Ia = ${f(kv)} × ${f(ifield)} × ${ia} = ${f(td)} N·m.`,
    };
  },
};

const semiCalc: CalculationQuestion = {
  id: 'm01.calc.semi-converter',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m01.lo4'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vs = pick(rng, [220, 230, 240]);
    const a = randStep(rng, 15, 120, 5);
    const vm = peakFromRms(vs);
    const va = converterAverageVoltage('single-semi', vm, degToRad(a));
    return {
      stem: `A single-phase semi-converter supplies a DC motor armature from a ${vs} V rms supply with firing angle αa = ${a}°. Assuming continuous current, find the average armature voltage in V.`,
      answer: va,
      unit: 'V',
      relativeTolerance: TOL,
      explanation: `Vm = √2 × ${vs} = ${f(vm)} V. Va = (Vm/π)(1 + cos αa) = (${f(vm)}/π)(1 + cos ${a}°) = ${f(va)} V.`,
    };
  },
};

const driveCalc: CalculationQuestion = {
  id: 'm01.calc.converter-drive',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m01.lo4', 'm01.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vs = pick(rng, [220, 240]);
    const rf = pick(rng, [150, 175, 200]);
    const kv = randStep(rng, 1, 1.6, 0.1);
    const ra = randStep(rng, 0.2, 0.6, 0.05);
    const aa = randStep(rng, 30, 70, 5);
    const ia = randStep(rng, 10, 30, 5);
    const vm = peakFromRms(vs);
    const vf = converterAverageVoltage('single-full', vm, 0);
    const ifield = fieldCurrent(vf, rf);
    const va = converterAverageVoltage('single-full', vm, degToRad(aa));
    const eg = va - ia * ra;
    const omega = eg / (kv * ifield);
    return {
      stem: `A separately excited DC motor is supplied by two single-phase full converters from a ${vs} V rms supply. The field converter is at maximum output (αf = 0°) with Rf = ${rf} Ω. The armature converter has αa = ${aa}°. Ra = ${f(ra)} Ω, Kv = ${f(kv)} V/(A·rad/s), and the armature current is ${ia} A, continuous. Find the speed in rad/s.`,
      answer: omega,
      unit: 'rad/s',
      relativeTolerance: TOL,
      explanation: `Vm = ${f(vm)} V. Vf = (2Vm/π)cos 0° = ${f(vf)} V, If = ${f(ifield)} A. Va = (2Vm/π)cos ${aa}° = ${f(va)} V. Eg = Va − Ia·Ra = ${f(eg)} V. ω = Eg/(Kv·If) = ${f(omega)} rad/s.`,
    };
  },
};

const startingCalc: CalculationQuestion = {
  id: 'm01.calc.starting-resistance',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m01.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const va = pick(rng, [110, 220, 240, 440]);
    const ra = randStep(rng, 0.2, 1, 0.1);
    const imax = randStep(rng, 20, 80, 5);
    const rst = startingResistance(va, ra, imax);
    return {
      stem: `A DC motor with Ra = ${f(ra)} Ω is started on a ${va} V supply. What starting resistance limits the starting current to ${imax} A? Give the answer in Ω.`,
      answer: rst,
      unit: 'Ω',
      relativeTolerance: TOL,
      explanation: `At standstill Eg = 0, so Ia = Va/(Ra + Rst). Rst = Va/Ia,max − Ra = ${va}/${imax} − ${f(ra)} = ${f(rst)} Ω. Without it the current would be ${f(va / ra)} A.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm01.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'intermediate',
  outcomeIds: ['m01.lo1'],
  stem: 'Explain why a DC motor draws a very large current at starting, and describe two ways of limiting it.',
  markingGuide: [
    'At standstill there is no back-emf (Eg = Kv·If·ω = 0), so Ia = Va/Ra, and Ra is small.',
    'The current can be many times the rated value: it can damage the commutator and windings and trip the supply.',
    'Limit it with a series starting resistance, cut out in steps as the speed (and Eg) rises.',
    'Or start with a reduced armature voltage (a controlled converter with a large firing angle αa) and raise it as the motor accelerates.',
  ],
};

const driveChain: ChainQuestion = {
  id: 'm01.chain.converter-drive',
  moduleId: MODULE,
  kind: 'chain',
  level: 'advanced',
  outcomeIds: ['m01.lo4', 'm01.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vs = pick(rng, [220, 240]);
    const rf = pick(rng, [150, 175, 200]);
    const kv = randStep(rng, 1, 1.6, 0.1);
    const ra = randStep(rng, 0.2, 0.6, 0.05);
    const aa = randStep(rng, 30, 70, 5);
    const ia = randStep(rng, 10, 30, 5);
    const vm = peakFromRms(vs);
    const vf = converterAverageVoltage('single-full', vm, 0);
    const va = converterAverageVoltage('single-full', vm, degToRad(aa));
    const speed = (vaGiven: number, ifGiven: number) => (vaGiven - ia * ra) / (kv * ifGiven);
    return {
      stem: `A separately excited DC motor is fed by two single-phase full converters from a ${vs} V rms supply: the field converter at αf = 0° with Rf = ${rf} Ω, the armature converter at αa = ${aa}°. Ra = ${f(ra)} Ω, Kv = ${f(kv)} V/(A·rad/s), Ia = ${ia} A (continuous). Work through the parts; later parts are marked on your own earlier answers.`,
      parts: [
        {
          label: '(a)',
          prompt: 'Output of the field converter, Vf',
          unit: 'V',
          relativeTolerance: TOL,
          answer: vf,
          compute: () => vf,
        },
        {
          label: '(b)',
          prompt: 'Field current If',
          unit: 'A',
          relativeTolerance: TOL,
          answer: fieldCurrent(vf, rf),
          compute: (e) => fieldCurrent(e[0] ?? Number.NaN, rf),
        },
        {
          label: '(c)',
          prompt: 'Output of the armature converter, Va',
          unit: 'V',
          relativeTolerance: TOL,
          answer: va,
          compute: () => va,
        },
        {
          label: '(d)',
          prompt: 'Speed ω',
          unit: 'rad/s',
          relativeTolerance: TOL,
          answer: speed(va, fieldCurrent(vf, rf)),
          compute: (e) => speed(e[2] ?? Number.NaN, e[1] ?? Number.NaN),
        },
      ],
      explanation: `Vm = √2 × ${vs} = ${f(vm)} V. (a) Vf = (2Vm/π)cos 0° = ${f(vf)} V. (b) If = Vf/Rf = ${f(fieldCurrent(vf, rf))} A. (c) Va = (2Vm/π)cos ${aa}° = ${f(va)} V. (d) ω = (Va − Ia·Ra)/(Kv·If) = ${f(speed(va, fieldCurrent(vf, rf)))} rad/s.`,
    };
  },
};

export const M01_QUESTIONS: readonly Question[] = [
  backEmfMcq,
  startingMcq,
  torqueCalc,
  fieldWeakeningMcq,
  seriesMcq,
  dualMcq,
  speedCalc,
  semiCalc,
  faultMcq,
  driveCalc,
  startingCalc,
  explainQuestion,
  driveChain,
];
