/**
 * M02 question bank (original to VADL). Calculation keys are computed by the
 * sim-core functions verified in tests/reference/ac-motor.test.ts.
 */
import { mulberry32, pick, randStep } from '@/features/assessment/rng';
import type {
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  circuitAtFrequency,
  inductionTorque,
  maxTorque,
  phaseVoltage,
  rotorCurrent,
  rotorFrequency,
  rpmToRadPerSec,
  slip,
  synchronousSpeed,
  synchronousSpeedRpm,
} from '@/sim-core';

const MODULE = 'm02-ac-motor';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const syncMcq: MultipleChoiceQuestion = {
  id: 'm02.mcq.sync-torque',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m02.lo1'],
  stem: 'Why can an induction motor never run exactly at synchronous speed when it is driving a load?',
  choices: [
    {
      id: 'a',
      text: 'At synchronous speed there is no relative motion, no rotor emf, no rotor current and so no torque',
    },
    {
      id: 'b',
      text: 'The bearings would overheat',
      explanationIfChosen: 'Bearing friction is not what limits the speed.',
    },
    {
      id: 'c',
      text: 'The supply frequency is too low',
      explanationIfChosen: 'At any frequency the rotor still lags the field.',
    },
    {
      id: 'd',
      text: 'The stator resistance prevents it',
      explanationIfChosen: 'Even with Rs = 0 the rotor needs slip to produce torque.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Torque comes from rotor currents induced by the field sweeping past the conductors. With S = 0 nothing is induced.',
};

const regionMcq: MultipleChoiceQuestion = {
  id: 'm02.mcq.regions',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m02.lo1'],
  stem: 'An induction machine is driven above its synchronous speed by the load (for example a lowering crane). What is its operating region?',
  choices: [
    {
      id: 'a',
      text: 'Motoring, 0 < S < 1',
      explanationIfChosen: 'Motoring needs the rotor slower than the field.',
    },
    { id: 'b', text: 'Regenerating, S < 0' },
    {
      id: 'c',
      text: 'Plugging, 1 < S < 2',
      explanationIfChosen: 'Plugging is the rotor turning against the field direction.',
    },
    {
      id: 'd',
      text: 'Standstill, S = 1',
      explanationIfChosen: 'S = 1 means the rotor is at rest.',
    },
  ],
  correctChoiceId: 'b',
  explanation:
    'Above synchronous speed S is negative, the torque reverses and the machine returns power to the supply.',
};

const vfMcq: MultipleChoiceQuestion = {
  id: 'm02.mcq.vf',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m02.lo3'],
  stem: 'Why is the voltage reduced in proportion to frequency when an induction motor is slowed down by lowering the frequency?',
  choices: [
    { id: 'a', text: 'To keep the air-gap flux near its rated value, avoiding saturation' },
    {
      id: 'b',
      text: 'To reduce the synchronous speed further',
      explanationIfChosen: 'Synchronous speed depends on frequency only.',
    },
    {
      id: 'c',
      text: 'To increase the starting torque',
      explanationIfChosen:
        'Without boost, V/f keeps Tmax constant (Rs = 0) rather than raising it.',
    },
    {
      id: 'd',
      text: 'To make the slip zero',
      explanationIfChosen: 'The motor still needs slip to produce torque.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Flux ∝ V/f. Lowering f at constant V would over-flux the iron and draw a large magnetising current.',
};

const rotorRMcq: MultipleChoiceQuestion = {
  id: 'm02.ts.rotor-resistance',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m02.lo3'],
  stem: 'A wound-rotor crane motor runs noticeably slower than expected at full load, and its rotor circuit is hot. The supply voltage and frequency are correct. What is the most likely cause?',
  choices: [
    { id: 'a', text: 'External rotor resistance left in circuit (not shorted out after starting)' },
    {
      id: 'b',
      text: 'Supply frequency too high',
      explanationIfChosen: 'The supply was checked; a higher frequency would raise the speed.',
    },
    {
      id: 'c',
      text: 'Load too light',
      explanationIfChosen: 'A light load would make the motor faster, not slower.',
    },
    {
      id: 'd',
      text: 'Open-circuited magnetising branch',
      explanationIfChosen: 'That is not a field fault you can have in a real motor in this way.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    "Torque depends on Rr'/S: extra rotor resistance increases the slip at the same torque, and the slip power S·Pg is dissipated as heat in the rotor circuit.",
};

const slipCalc: CalculationQuestion = {
  id: 'm02.calc.slip',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m02.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const poles = pick(rng, [2, 4, 6, 8]);
    const freq = pick(rng, [50, 60]);
    const ns = synchronousSpeedRpm(freq, poles);
    const s = randStep(rng, 0.02, 0.06, 0.005);
    const n = Math.round(ns * (1 - s));
    const sl = slip(ns, n);
    return {
      stem: `A ${poles}-pole, ${freq} Hz induction motor runs at ${n} rpm. Find the slip as a percentage.`,
      answer: 100 * sl,
      unit: '%',
      relativeTolerance: TOL,
      explanation: `Ns = 120f/p = 120 × ${freq}/${poles} = ${f(ns)} rpm. S = (Ns − N)/Ns = (${f(ns)} − ${n})/${f(ns)} = ${f(sl)} = ${f(100 * sl)} %.`,
    };
  },
};

const rotorFreqCalc: CalculationQuestion = {
  id: 'm02.calc.rotor-frequency',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m02.lo1'],
  generate(seed) {
    const rng = mulberry32(seed);
    const freq = pick(rng, [50, 60]);
    const s = randStep(rng, 0.02, 0.08, 0.005);
    const fr = rotorFrequency(s, freq);
    return {
      stem: `An induction motor on a ${freq} Hz supply runs with a slip of ${f(100 * s)} %. What is the frequency of the rotor currents, in Hz?`,
      answer: fr,
      unit: 'Hz',
      relativeTolerance: TOL,
      explanation: `fr = S·f = ${f(s)} × ${freq} = ${f(fr)} Hz.`,
    };
  },
};

const torqueCalc: CalculationQuestion = {
  id: 'm02.calc.torque',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m02.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vl = pick(rng, [380, 400, 415, 460]);
    const freq = pick(rng, [50, 60]);
    const rs = randStep(rng, 0.2, 0.6, 0.05);
    const rr = randStep(rng, 0.2, 0.5, 0.05);
    const x = randStep(rng, 0.6, 1.2, 0.1);
    const n = Math.round(synchronousSpeedRpm(freq, 4) * (1 - randStep(rng, 0.02, 0.05, 0.005)));
    const c = { rs, rr, xs: x, xr: x, xm: 30 };
    const vs = phaseVoltage(vl);
    const ws = synchronousSpeed(freq, 4);
    const s = slip(ws, rpmToRadPerSec(n));
    const ir = rotorCurrent(vs, c, s);
    const td = inductionTorque(vs, ws, c, s);
    return {
      stem: `A 4-pole, ${freq} Hz, ${vl} V (line), star-connected induction motor has Rs = ${f(rs)} Ω, Rr' = ${f(rr)} Ω and Xs = Xr' = ${f(x)} Ω (approximate circuit, Xm at the terminals). Find the developed torque at ${n} rpm, in N·m.`,
      answer: td,
      unit: 'N·m',
      relativeTolerance: TOL,
      explanation: `Vs = ${vl}/√3 = ${f(vs)} V; ωs = 4π·${freq}/4 = ${f(ws)} rad/s; S = ${f(s)}. Ir' = Vs/√[(Rs + Rr'/S)² + (Xs + Xr')²] = ${f(ir)} A. Td = 3Ir'²Rr'/(S·ωs) = ${f(td)} N·m.`,
    };
  },
};

const tmaxVfCalc: CalculationQuestion = {
  id: 'm02.calc.tmax-vf',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m02.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const vl = pick(rng, [400, 415, 460]);
    const fr0 = pick(rng, [50, 60]);
    const freq = randStep(rng, 20, fr0 - 10, 5);
    const xs = randStep(rng, 0.8, 1.6, 0.1);
    const xr = randStep(rng, 0.8, 1.8, 0.1);
    const c0 = { rs: 0, rr: 0.4, xs, xr, xm: 30 };
    const c = circuitAtFrequency(c0, freq, fr0);
    const vs = phaseVoltage(vl) * (freq / fr0);
    const ws = synchronousSpeed(freq, 4);
    const tm = maxTorque(vs, ws, c);
    return {
      stem: `A 4-pole, ${vl} V (line), ${fr0} Hz star-connected induction motor with Rs = 0, Xs = ${f(xs)} Ω and Xr' = ${f(xr)} Ω (at ${fr0} Hz) is run at ${freq} Hz with constant V/f. Find the maximum torque, in N·m.`,
      answer: tm,
      unit: 'N·m',
      relativeTolerance: TOL,
      explanation: `With V/f constant: Vs = ${f(phaseVoltage(vl))} × ${freq}/${fr0} = ${f(vs)} V, X = (${f(xs + xr)})·${freq}/${fr0} = ${f(c.xs + c.xr)} Ω, ωs = ${f(ws)} rad/s. Tmax = 3Vs²/(2ωs·X) = ${f(tm)} N·m — the same as at ${fr0} Hz.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm02.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'intermediate',
  outcomeIds: ['m02.lo3'],
  stem: 'Explain why constant V/f control is used to reduce the speed of an induction motor below its rated frequency.',
  markingGuide: [
    'Synchronous speed Ns = 120f/p, so lowering f lowers the speed.',
    'The air-gap flux is proportional to V/f; reducing f at constant V would over-flux and saturate the iron, drawing a large magnetising current.',
    'Keeping V/f constant keeps the flux, and so the maximum torque (with Rs neglected), about constant.',
    'At very low frequency the stator resistance drop matters and a voltage boost is needed.',
  ],
};

export const M02_QUESTIONS: readonly Question[] = [
  syncMcq,
  slipCalc,
  rotorFreqCalc,
  regionMcq,
  vfMcq,
  torqueCalc,
  rotorRMcq,
  tmaxVfCalc,
  explainQuestion,
];
