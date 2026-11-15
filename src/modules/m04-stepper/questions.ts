/**
 * M04 question bank (original to VADL). Calculation keys and sequence tables are
 * computed by the sim-core functions verified in tests/reference/stepper-motor.test.ts.
 * Pulse counts are marked exactly (course-alignment §5.11).
 */
import { mulberry32, pick, randInt } from '@/features/assessment/rng';
import type {
  ChainQuestion,
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
  SequenceQuestion,
} from '@/features/assessment/types';
import {
  degToRad,
  pulseRateForSpeed,
  pulsesForAngle,
  pulsesPerRevolution,
  radPerSecToRpm,
  radToDeg,
  rpmToRadPerSec,
  STEPPER_PRESETS,
  stepAngleFromSteps,
  stepAngleFromTeeth,
  stepperSequenceTable,
  stepperSpeed,
  vrPhaseCount,
  type StepMode,
  type StepperParams,
  stepTime,
} from '@/sim-core';

const MODULE = 'm04-stepper';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

/** Valid VR tooth combinations (integer PPR, 3–5 phases). */
const VR_TEETH: readonly (readonly [number, number])[] = [
  [6, 4],
  [12, 8],
  [8, 6],
  [24, 16],
  [10, 8],
  [12, 9],
];

const teethMcq: MultipleChoiceQuestion = {
  id: 'm04.mcq.teeth',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m04.lo1'],
  stem: 'Why does a variable-reluctance stepper motor never have the same number of stator poles and rotor teeth?',
  choices: [
    {
      id: 'a',
      text: 'With equal counts every tooth lines up at once, so energising the next phase gives no turning force',
    },
    {
      id: 'b',
      text: 'Equal counts would make the motor too heavy',
      explanationIfChosen: 'The reason is magnetic, not mechanical.',
    },
    {
      id: 'c',
      text: 'The supply needs an odd number of phases',
      explanationIfChosen: 'Two-, three- and four-phase VR motors all exist.',
    },
    {
      id: 'd',
      text: 'It would double the step angle',
      explanationIfChosen: 'With Ns = Nr the formula gives Sa = 0, not a larger step.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The step comes from the mismatch: Sa = (Ns − Nr)/(Ns·Nr) × 360°. With Ns = Nr the angle is zero and the rotor has no preferred next position.',
};

const normalMcq: MultipleChoiceQuestion = {
  id: 'm04.mcq.normal-drive',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m04.lo3'],
  stem: 'On a two-phase motor, what is the main advantage of normal drive (two phases on) over wave drive (one phase on)?',
  choices: [
    { id: 'a', text: 'More holding torque, for the same step angle' },
    {
      id: 'b',
      text: 'Half the step angle',
      explanationIfChosen: 'That is half-step drive, which alternates one and two phases.',
    },
    {
      id: 'c',
      text: 'Lower supply current',
      explanationIfChosen: 'Two coils are energised, so the supply current is higher.',
    },
    {
      id: 'd',
      text: 'The rotor no longer needs teeth',
      explanationIfChosen: 'The rotor construction does not depend on the drive mode.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Both coils pull together and the rotor rests midway between them; the torques add (about √2 times one phase on a two-phase motor). The step angle is the same as wave drive.',
};

const detentMcq: MultipleChoiceQuestion = {
  id: 'm04.mcq.detent',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m04.lo1'],
  stem: 'Which type of stepper motor has no detent torque when its windings are switched off?',
  choices: [
    { id: 'a', text: 'Variable reluctance' },
    {
      id: 'b',
      text: 'Permanent magnet',
      explanationIfChosen: 'The rotor magnet is attracted to the stator iron even with no current.',
    },
    {
      id: 'c',
      text: 'Hybrid',
      explanationIfChosen:
        'The hybrid rotor contains a permanent magnet, which gives detent torque.',
    },
    {
      id: 'd',
      text: 'All of them have detent torque',
      explanationIfChosen: 'Detent torque needs a magnet in the rotor.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A VR rotor is soft iron with no magnetisation, so with no stator current nothing holds it.',
};

const lostStepsTs: MultipleChoiceQuestion = {
  id: 'm04.ts.lost-steps',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m04.lo1', 'm04.lo4'],
  stem: 'A stepper-driven table is commanded to move with the pulse train switched straight to 2000 pulses/s. The motor buzzes, the table moves less than commanded, and its position is wrong afterwards. At 300 pulses/s it works. What is the most likely cause?',
  choices: [
    {
      id: 'a',
      text: 'The motor cannot accelerate the load to that step rate at once, so it misses steps; ramp the pulse rate up',
    },
    {
      id: 'b',
      text: 'The phase sequence is reversed',
      explanationIfChosen:
        'A reversed sequence would move the table the wrong way, also at 300 pulses/s.',
    },
    {
      id: 'c',
      text: 'The step angle is too small',
      explanationIfChosen: 'The step angle sets the resolution, not whether steps are lost.',
    },
    {
      id: 'd',
      text: 'The encoder is faulty',
      explanationIfChosen:
        'An open-loop stepper has no encoder; that is why lost steps go unnoticed.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'Torque falls with pulse rate and the rotor must reach each step before the next pulse. Too high a starting rate (or too much load or inertia) makes the rotor fall behind by whole cycles: steps are lost, and an open-loop system cannot detect it.',
};

const stepAngleCalc: CalculationQuestion = {
  id: 'm04.calc.step-angle',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m04.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [ns, nr] = pick(rng, VR_TEETH);
    const sa = radToDeg(stepAngleFromTeeth(ns, nr));
    return {
      stem: `A variable-reluctance stepper motor has ${ns} stator poles and ${nr} rotor teeth. Find its step angle, in degrees.`,
      answer: sa,
      unit: '°',
      relativeTolerance: TOL,
      explanation: `Sa = (Ns − Nr)/(Ns·Nr) × 360° = (${ns} − ${nr})/(${ns}·${nr}) × 360° = ${f(sa)}°. It has m = Ns/(Ns − Nr) = ${f(vrPhaseCount(ns, nr))} phases and ${f(pulsesPerRevolution(stepAngleFromTeeth(ns, nr)))} steps per revolution.`,
    };
  },
};

const speedCalc: CalculationQuestion = {
  id: 'm04.calc.speed',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m04.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const saDeg = pick(rng, [1.8, 3.6, 7.5, 15, 30]);
    const pr = pick(rng, [20, 50, 100, 120, 200, 300, 400, 500]);
    const n = radPerSecToRpm(stepperSpeed(degToRad(saDeg), pr));
    return {
      stem: `A stepper motor with a step angle of ${saDeg}° is driven at ${pr} pulses per second. Find its speed, in rpm.`,
      answer: n,
      unit: 'rpm',
      relativeTolerance: TOL,
      explanation: `N = Sa·PR/6 = ${saDeg} × ${pr}/6 = ${f(n)} rpm (equivalently PR × 60/PPR with PPR = ${f(360 / saDeg)}).`,
    };
  },
};

const pulseRateCalc: CalculationQuestion = {
  id: 'm04.calc.pulse-rate',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m04.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [ns, nr] = pick(rng, VR_TEETH);
    const sa = stepAngleFromTeeth(ns, nr);
    const nRpm = pick(rng, [50, 60, 100, 120, 150, 200, 250, 300]);
    const pr = pulseRateForSpeed(sa, rpmToRadPerSec(nRpm));
    return {
      stem: `A ${ns}/${nr} variable-reluctance stepper motor (Ns = ${ns}, Nr = ${nr}) must turn at ${nRpm} rpm in full-step drive. Find the pulse rate, in pulses per second.`,
      answer: pr,
      unit: 'pulses/s',
      relativeTolerance: TOL,
      explanation: `Sa = (${ns} − ${nr})/(${ns}·${nr}) × 360° = ${f(radToDeg(sa))}°. PR = 6N/Sa = 6 × ${nRpm}/${f(radToDeg(sa))} = ${f(pr)} pulses/s; the time per step is 1/PR = ${f(1 / pr)} s.`,
    };
  },
};

const pulsesCalc: CalculationQuestion = {
  id: 'm04.calc.pulses-half',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m04.lo2', 'm04.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const ppr = pick(rng, [48, 100, 200, 400]);
    const half = rng() < 0.5;
    const sa = stepAngleFromSteps(ppr) / (half ? 2 : 1);
    const turns = randInt(rng, 1, 8) / 4; // ¼ to 2 turns
    const angle = 360 * turns;
    const pulses = pulsesForAngle(degToRad(angle), sa);
    return {
      stem: `A stepper motor has ${ppr} full steps per revolution and is driven in ${half ? 'half-step' : 'full-step'} mode. How many pulses turn it through ${angle}°?`,
      answer: pulses,
      unit: 'pulses',
      relativeTolerance: 0,
      explanation: `Angle per pulse = 360°/${ppr}${half ? '/2' : ''} = ${f(radToDeg(sa))}°. Pulses = ${angle}°/${f(radToDeg(sa))}° = ${f(pulses, 6)}. Pulse counts must be exact.`,
    };
  },
};

/** VR motors for the sequence questions: (Ns, Nr). Three or four phases. */
const SEQ_VR: readonly (readonly [number, number])[] = [
  [6, 4],
  [12, 8],
  [8, 6],
];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function sequenceExplanation(p: StepperParams, startText: string): string {
  const dir = p.direction === 'cw' ? 'clockwise' : 'anticlockwise';
  return `Start from ${startText} and move one position per pulse, ${dir}. The angle changes by the angle per pulse each step (Sa for full step, Sa/2 for half step).`;
}

const vrSequence: SequenceQuestion = {
  id: 'm04.seq.vr',
  moduleId: MODULE,
  kind: 'sequence',
  level: 'intermediate',
  outcomeIds: ['m04.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [ns, nr] = pick(rng, SEQ_VR);
    const mode = pick<StepMode>(rng, ['wave', 'normal', 'half']);
    const direction = rng() < 0.7 ? 'cw' : 'ccw';
    const p: StepperParams = {
      ...STEPPER_PRESETS.vr64,
      statorTeeth: ns,
      rotorTeeth: nr,
      mode,
      direction,
    };
    const m = Math.round(vrPhaseCount(ns, nr));
    const rows = mode === 'half' ? 2 * m + 1 : m + 1;
    const table = stepperSequenceTable(p, rows);
    const start = mode === 'normal' ? 'phases A and B energised' : 'phase A energised';
    const modeText = {
      wave: 'wave drive (one phase on)',
      normal: 'normal drive (two phases on)',
      half: 'half-step drive',
      micro: '',
    }[mode];
    return {
      stem: `A ${m}-phase variable-reluctance stepper motor with ${ns} stator poles and ${nr} rotor teeth runs in ${modeText}, ${direction === 'cw' ? 'clockwise (positive angles)' : 'anticlockwise (negative angles)'}. Step 1 is the starting position with ${start}${mode === 'normal' ? `, rotor at ${f(radToDeg(table[0]?.angle ?? 0))}°` : ', rotor at 0°'}. Complete the first ${rows} steps.`,
      phaseLabels: LETTERS.slice(0, m),
      cellKind: 'on-off',
      answer: table.map((r) => r.currents.map((i) => (i ? 1 : 0))),
      angles: table.map((r) => Number(radToDeg(r.angle).toFixed(9))),
      angleTolerance: 0.5,
      explanation: sequenceExplanation(p, start),
    };
  },
};

const bipolarSequence: SequenceQuestion = {
  id: 'm04.seq.bipolar',
  moduleId: MODULE,
  kind: 'sequence',
  level: 'advanced',
  outcomeIds: ['m04.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const ppr = pick(rng, [48, 200]);
    const mode = pick<StepMode>(rng, ['wave', 'normal', 'half']);
    const direction = rng() < 0.6 ? 'cw' : 'ccw';
    const p: StepperParams = {
      ...STEPPER_PRESETS.hybrid,
      stepsPerRev: ppr,
      mode,
      direction,
    };
    const rows = mode === 'half' ? 8 : 4;
    const table = stepperSequenceTable(p, rows);
    const sa = radToDeg(stepAngleFromSteps(ppr));
    const start = mode === 'normal' ? 'A+ and B+' : 'A+ only';
    return {
      stem: `A two-phase bipolar stepper motor (${ppr} steps per revolution, Sa = ${f(sa)}°) runs in ${mode === 'half' ? 'half-step' : mode === 'normal' ? 'normal (two-phase-on)' : 'wave'} drive, ${direction === 'cw' ? 'clockwise (positive angles)' : 'anticlockwise (negative angles)'}. Step 1 is the starting position with ${start}${mode === 'normal' ? `, rotor at ${f(radToDeg(table[0]?.angle ?? 0))}°` : ', rotor at 0°'}. For each step give the current direction in coils A and B (+, − or 0) and the rotor angle.`,
      phaseLabels: ['A', 'B'],
      cellKind: 'polarity',
      answer: table.map((r) => r.currents.map((i) => Math.sign(i))),
      angles: table.map((r) => Number(radToDeg(r.angle).toFixed(9))),
      angleTolerance: 0.5,
      explanation: `${sequenceExplanation(p, start)} Clockwise the current vector turns A+ → B+ → A− → B−.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm04.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'beginner',
  outcomeIds: ['m04.lo1'],
  stem: 'Compare a stepper motor and a servo motor for positioning a machine axis.',
  markingGuide: [
    'A stepper is open loop: position is set by counting pulses, with no sensor; simple and cheap; full torque at standstill.',
    'A stepper can lose steps if overloaded or driven too fast, and nothing detects it.',
    'A servo is closed loop: a sensor (encoder or resolver) measures the position and the amplifier corrects any error.',
    'A servo gives higher speed and torque at speed and recovers from disturbances, but costs more and needs tuning.',
  ],
};

const stepperChain: ChainQuestion = {
  id: 'm04.chain.vr-drive',
  moduleId: MODULE,
  kind: 'chain',
  level: 'intermediate',
  outcomeIds: ['m04.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const [ns, nr] = pick(rng, VR_TEETH);
    const n = pick(rng, [50, 60, 100, 120, 150, 200]);
    const sa = radToDeg(stepAngleFromTeeth(ns, nr));
    const prOf = (saDeg: number) => pulseRateForSpeed(degToRad(saDeg), rpmToRadPerSec(n));
    return {
      stem: `A variable-reluctance stepper motor has ${ns} stator poles and ${nr} rotor teeth and must turn at ${n} rpm in full-step drive. Later parts are marked on your own earlier answers.`,
      parts: [
        {
          label: '(a)',
          prompt: 'Step angle Sa',
          unit: '°',
          relativeTolerance: TOL,
          answer: sa,
          compute: () => sa,
        },
        {
          label: '(b)',
          prompt: 'Pulses per revolution',
          unit: 'pulses',
          relativeTolerance: TOL,
          answer: pulsesPerRevolution(degToRad(sa)),
          compute: (e) => pulsesPerRevolution(degToRad(e[0] ?? Number.NaN)),
        },
        {
          label: '(c)',
          prompt: 'Pulse rate PR',
          unit: 'pulses/s',
          relativeTolerance: TOL,
          answer: prOf(sa),
          compute: (e) => prOf(e[0] ?? Number.NaN),
        },
        {
          label: '(d)',
          prompt: 'Time per step',
          unit: 's',
          relativeTolerance: TOL,
          answer: stepTime(prOf(sa)),
          compute: (e) => stepTime(e[2] ?? Number.NaN),
        },
      ],
      explanation: `(a) Sa = (Ns − Nr)/(Ns·Nr) × 360° = ${f(sa)}°. (b) PPR = 360/Sa = ${f(pulsesPerRevolution(degToRad(sa)))}. (c) PR = 6N/Sa = ${f(prOf(sa))} pulses/s. (d) t = 1/PR = ${f(stepTime(prOf(sa)))} s.`,
    };
  },
};

export const M04_QUESTIONS: readonly Question[] = [
  teethMcq,
  stepAngleCalc,
  speedCalc,
  normalMcq,
  pulseRateCalc,
  pulsesCalc,
  detentMcq,
  vrSequence,
  bipolarSequence,
  lostStepsTs,
  explainQuestion,
  stepperChain,
];
