/**
 * M03 question bank (original to VADL). Calculation keys are computed by the
 * sim-core functions verified in tests/reference.
 */
import { mulberry32, pick, randStep } from '@/features/assessment/rng';
import type {
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import { converterAverageVoltage, dcdcConverter, degToRad, peakFromRms } from '@/sim-core';

const MODULE = 'm03-power-converters';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const alphaMcq: MultipleChoiceQuestion = {
  id: 'm03.mcq.alpha-180',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m03.lo1'],
  stem: 'In Lab 1, why is the output of the half-wave thyristor converter zero at α = 180°?',
  choices: [
    {
      id: 'a',
      text: 'The thyristor is fired at the end of the positive half cycle, so it never conducts',
    },
    {
      id: 'b',
      text: 'The diode short-circuits the load',
      explanationIfChosen:
        'There is no conducting diode across the load in this circuit at α = 180°.',
    },
    {
      id: 'c',
      text: 'The supply voltage is zero at all times',
      explanationIfChosen: 'The supply is still a 240 V sine wave.',
    },
    {
      id: 'd',
      text: 'The load resistance becomes infinite',
      explanationIfChosen: 'The load does not change with α.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A thyristor conducts only once fired while forward biased. Fired at 180° the forward-biased interval has ended, so the output stays at zero.',
};

const inversionMcq: MultipleChoiceQuestion = {
  id: 'm03.mcq.inversion',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m03.lo2'],
  stem: 'A single-phase full converter with a highly inductive load is fired at α = 120°. What is its average output voltage?',
  choices: [
    { id: 'a', text: 'Negative: (2Vm/π)·cos 120° < 0, the converter inverts' },
    {
      id: 'b',
      text: 'Zero',
      explanationIfChosen: 'Zero average happens at α = 90° for this converter.',
    },
    {
      id: 'c',
      text: 'Positive, (Vm/π)(1 + cos 120°)',
      explanationIfChosen:
        'That is the R-load or semi-converter formula, not the full converter with continuous current.',
    },
    {
      id: 'd',
      text: 'Equal to the supply rms voltage',
      explanationIfChosen: 'The average of a rectified wave is not the rms value.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With continuous current each thyristor pair conducts for 180°, including part of the negative half cycle. Above 90° the negative part dominates; power then flows back to the supply if the load (e.g. a DC motor) can keep the current flowing.',
};

const pwmMcq: MultipleChoiceQuestion = {
  id: 'm03.mcq.pwm',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m03.lo4'],
  stem: 'Why is sinusoidal PWM preferred to a square-wave inverter for motor drives?',
  choices: [
    {
      id: 'a',
      text: 'It moves the harmonics to high frequencies near the carrier, which the motor inductance filters out',
    },
    {
      id: 'b',
      text: 'It produces a larger fundamental voltage',
      explanationIfChosen:
        'In the linear region PWM gives a smaller fundamental than a square wave.',
    },
    {
      id: 'c',
      text: 'It uses fewer switches',
      explanationIfChosen: 'The same bridge is used; only the switching pattern differs.',
    },
    {
      id: 'd',
      text: 'It has no switching losses',
      explanationIfChosen: 'PWM switches more often, so switching losses are higher.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A square wave has large low-order harmonics (3rd, 5th, 7th) that cause current distortion and torque ripple. PWM pushes harmonic energy up to around mf times the output frequency.',
};

const dcmMcq: MultipleChoiceQuestion = {
  id: 'm03.ts.dcm',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m03.lo3'],
  stem: 'A buck converter gives a higher output voltage than D·Vs at light load, although D is measured correctly. What is the most likely explanation?',
  choices: [
    {
      id: 'a',
      text: 'The inductor current falls to zero each period (discontinuous conduction), so Vo = D·Vs no longer applies',
    },
    {
      id: 'b',
      text: 'The switching frequency is too high',
      explanationIfChosen: 'A higher frequency makes conduction more continuous, not less.',
    },
    {
      id: 'c',
      text: 'The output capacitor is too large',
      explanationIfChosen: 'A larger C reduces ripple; it does not shift the average this way.',
    },
    {
      id: 'd',
      text: 'The diode is open-circuit',
      explanationIfChosen:
        'An open diode would stop the converter working properly, with spikes rather than a smooth higher voltage.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Light load raises Lmin = (1 − D)R/(2f) above the fitted L. In discontinuous conduction the output rises towards Vs and depends on the load.',
};

const halfWaveCalc: CalculationQuestion = {
  id: 'm03.calc.half-wave-thyristor',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m03.lo2', 'm03.lo5'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vs = pick(rng, [120, 220, 240]);
    const a = pick(rng, [30, 45, 60, 90, 120]);
    const vm = peakFromRms(vs);
    const v = converterAverageVoltage('single-half', vm, degToRad(a));
    return {
      stem: `A half-wave thyristor converter with a resistive load is supplied at ${vs} V rms and fired at α = ${a}°. Find the average output voltage, in V.`,
      answer: v,
      unit: 'V',
      relativeTolerance: TOL,
      explanation: `Vm = √2 × ${vs} = ${f(vm)} V. Vavg = (Vm/2π)(1 + cos α) = (${f(vm)}/2π)(1 + cos ${a}°) = ${f(v)} V.`,
    };
  },
};

const threePhaseCalc: CalculationQuestion = {
  id: 'm03.calc.three-phase',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m03.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vl = pick(rng, [380, 400, 415]);
    const a = randStep(rng, 0, 75, 15);
    const vm = (Math.SQRT2 * vl) / Math.sqrt(3);
    const v = converterAverageVoltage('three-full', vm, degToRad(a));
    return {
      stem: `A three-phase fully controlled bridge on a ${vl} V (line) supply feeds a highly inductive load with continuous current. Find the average output voltage at α = ${a}°, in V.`,
      answer: v,
      unit: 'V',
      relativeTolerance: TOL,
      explanation: `Peak phase voltage Vm = √2 × ${vl}/√3 = ${f(vm)} V. Vavg = (3√3·Vm/π)·cos α = ${f((3 * Math.sqrt(3) * vm) / Math.PI)} × cos ${a}° = ${f(v)} V (≈ 1.35 × ${vl} × cos α).`,
    };
  },
};

const boostCalc: CalculationQuestion = {
  id: 'm03.calc.boost',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m03.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vs = pick(rng, [12, 24, 48]);
    const d = randStep(rng, 0.2, 0.7, 0.05);
    const r = dcdcConverter('boost', vs, d, 1e-3, 470e-6, 20, 20e3);
    return {
      stem: `An ideal boost converter in continuous conduction has an input of ${vs} V and a duty cycle of ${f(d)}. Find the output voltage, in V.`,
      answer: r.vo,
      unit: 'V',
      relativeTolerance: TOL,
      explanation: `Vo = Vs/(1 − D) = ${vs}/(1 − ${f(d)}) = ${f(r.vo)} V.`,
    };
  },
};

const lminCalc: CalculationQuestion = {
  id: 'm03.calc.buck-lmin',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m03.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const d = randStep(rng, 0.2, 0.7, 0.05);
    const rl = pick(rng, [5, 10, 20, 50]);
    const fs = pick(rng, [10e3, 20e3, 25e3, 50e3]);
    const r = dcdcConverter('buck', 48, d, 1e-3, 100e-6, rl, fs);
    return {
      stem: `A buck converter switches at ${fs / 1000} kHz with D = ${f(d)} and feeds a ${rl} Ω load. Find the minimum inductance for continuous conduction, in µH.`,
      answer: r.lMin * 1e6,
      unit: 'µH',
      relativeTolerance: TOL,
      explanation: `Lmin = (1 − D)R/(2f) = (1 − ${f(d)}) × ${rl}/(2 × ${fs}) = ${f(r.lMin * 1e6)} µH.`,
    };
  },
};

export const M03_QUESTIONS: readonly Question[] = [
  alphaMcq,
  halfWaveCalc,
  inversionMcq,
  threePhaseCalc,
  boostCalc,
  pwmMcq,
  dcmMcq,
  lminCalc,
];
