/**
 * M05 question bank (original to VADL). Calculation keys are computed by the
 * sim-core functions verified in tests/reference/servo-motor.test.ts.
 * Encoder counts are marked exactly (course-alignment §5.11).
 */
import { mulberry32, pick, randInt, randStep } from '@/features/assessment/rng';
import type {
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
} from '@/features/assessment/types';
import {
  degToRad,
  encoderCount,
  encoderResolution,
  positionServoLoadError,
  positionServoSecondOrder,
  radToDeg,
} from '@/sim-core';

const MODULE = 'm05-servo';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

const driveSignalMcq: MultipleChoiceQuestion = {
  id: 'm05.mcq.drive-signal',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m05.lo1'],
  stem: 'In a servo system, what signal does the servo amplifier act on?',
  choices: [
    {
      id: 'a',
      text: 'The difference between the control signal and the feedback signal, Vcs − Vfc',
    },
    {
      id: 'b',
      text: 'The control signal Vcs alone',
      explanationIfChosen:
        'Using the command alone would be open-loop control, with no correction.',
    },
    {
      id: 'c',
      text: 'The feedback signal Vfc alone',
      explanationIfChosen:
        'The feedback must be compared with the command to know what to correct.',
    },
    {
      id: 'd',
      text: 'The sum Vcs + Vfc',
      explanationIfChosen:
        'Adding the feedback would push the motor further away (positive feedback).',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The drive signal is Vcs − Vfc. It is large when the shaft is far from the command and zero when it arrives, so the motor stops at the commanded position.',
};

const servoStepperMcq: MultipleChoiceQuestion = {
  id: 'm05.mcq.servo-vs-stepper',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m05.lo2'],
  stem: 'A machine axis must hold its position accurately even when the cutting load changes suddenly. Why is a servo motor preferred to a stepper motor here?',
  choices: [
    {
      id: 'a',
      text: 'Its feedback sensor detects any position error and the amplifier corrects it',
    },
    {
      id: 'b',
      text: 'It needs no sensor',
      explanationIfChosen:
        'It is the stepper that runs without a sensor; the servo depends on one.',
    },
    {
      id: 'c',
      text: 'It moves in fixed steps',
      explanationIfChosen: 'Moving in fixed steps is the stepper principle.',
    },
    {
      id: 'd',
      text: 'It is always cheaper',
      explanationIfChosen: 'A servo with its encoder and amplifier usually costs more.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A stepper is open loop: if the load makes it miss steps, nothing notices. A servo measures the actual position and keeps driving until the error is removed.',
};

const acServoMcq: MultipleChoiceQuestion = {
  id: 'm05.mcq.ac-servo',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m05.lo2'],
  stem: 'How is the direction of a two-phase AC servo motor reversed?',
  choices: [
    { id: 'a', text: 'By shifting the control-winding voltage from 0° to 180°' },
    {
      id: 'b',
      text: 'By reversing the DC field current',
      explanationIfChosen: 'A two-phase AC servo has no DC field winding.',
    },
    {
      id: 'c',
      text: 'By removing the capacitor',
      explanationIfChosen: 'The capacitor provides the 90° shift that produces the rotating field.',
    },
    {
      id: 'd',
      text: 'By raising the supply frequency',
      explanationIfChosen: 'Frequency changes the speed of the field, not its direction.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The fixed and control windings are 90° apart. Reversing the control voltage (0° → 180°) reverses the direction in which the field rotates, and so the motor direction.',
};

const resolverMcq: MultipleChoiceQuestion = {
  id: 'm05.mcq.resolver',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m05.lo3'],
  stem: 'A resolver gives a negative sine output and a positive cosine output. In which quadrant is the shaft?',
  choices: [
    {
      id: 'a',
      text: 'First (0°–90°)',
      explanationIfChosen: 'In the first quadrant both outputs are positive.',
    },
    {
      id: 'b',
      text: 'Second (90°–180°)',
      explanationIfChosen: 'In the second quadrant the sine is positive and the cosine negative.',
    },
    {
      id: 'c',
      text: 'Third (180°–270°)',
      explanationIfChosen: 'In the third quadrant both outputs are negative.',
    },
    { id: 'd', text: 'Fourth (270°–360°)' },
  ],
  correctChoiceId: 'd',
  explanation:
    'Vsin ∝ sin θ < 0 means 180°–360°; Vcos ∝ cos θ > 0 means 270°–90°. Both hold in the fourth quadrant.',
};

const huntingTs: MultipleChoiceQuestion = {
  id: 'm05.ts.hunting',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m05.lo4'],
  stem: 'After the amplifier gain of a position servo was raised to make it faster, the shaft overshoots and swings back and forth several times before settling. What is the best remedy?',
  choices: [
    {
      id: 'a',
      text: 'Reduce the gain or add derivative (speed) feedback to increase the damping',
    },
    {
      id: 'b',
      text: 'Increase the gain further',
      explanationIfChosen: 'More gain lowers the damping ratio and makes the swinging worse.',
    },
    {
      id: 'c',
      text: 'Replace the encoder with one of fewer lines',
      explanationIfChosen: 'A coarser sensor makes positioning worse, not better.',
    },
    {
      id: 'd',
      text: 'Add integral action',
      explanationIfChosen: 'Integral action removes steady error but tends to add overshoot.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The damping ratio ζ = (B + kφ²/Ra)/(2√(K·J)) falls as the loop gain K rises. Lower gain, or speed feedback (Kd), restores damping.',
};

const encoderCountCalc: CalculationQuestion = {
  id: 'm05.calc.encoder-count',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m05.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const lines = pick(rng, [100, 250, 360, 500, 1000, 1024, 2048]);
    const quarters = randInt(rng, 1, 10);
    const angle = 90 * quarters;
    const counts = encoderCount(degToRad(angle), lines);
    return {
      stem: `A quadrature encoder has ${lines} lines per revolution and counts every edge of channels A and B. How many counts does it give when the shaft turns ${angle}°?`,
      answer: counts,
      unit: 'counts',
      relativeTolerance: 0,
      explanation: `4 counts per line: 4 × ${lines} = ${4 * lines} counts per revolution. ${angle}° is ${f(angle / 360)} of a turn, so ${4 * lines} × ${f(angle / 360)} = ${counts} counts.`,
    };
  },
};

const encoderLinesCalc: CalculationQuestion = {
  id: 'm05.calc.encoder-lines',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m05.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const whole = randInt(rng, 1, 9);
    const quarter = randInt(rng, 1, 3);
    const lines = whole + quarter / 4;
    // A 100-line disc turned through `lines` line pitches: angle = lines × 2π/100.
    const counts = encoderCount((lines / 100) * 2 * Math.PI, 100);
    return {
      stem: `The shaft of a quadrature encoder turns through ${whole} ${['¼', '½', '¾'][quarter - 1]} lines of the disc. How many quadrature counts are produced?`,
      answer: counts,
      unit: 'counts',
      relativeTolerance: 0,
      explanation: `Each line gives 4 counts (rising and falling edges of A and B): ${f(lines)} × 4 = ${counts} counts (course example: 2¾ lines → 11 counts).`,
    };
  },
};

const resolutionCalc: CalculationQuestion = {
  id: 'm05.calc.resolution',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m05.lo3'],
  generate(seed) {
    const rng = mulberry32(seed);
    const lines = pick(rng, [100, 200, 250, 360, 500, 1000, 1024]);
    const res = radToDeg(encoderResolution(lines));
    return {
      stem: `What is the angular resolution, in degrees, of a ${lines}-line encoder with quadrature (×4) counting?`,
      answer: res,
      unit: '°',
      relativeTolerance: TOL,
      explanation: `Resolution = 360°/(4L) = 360/(4 × ${lines}) = ${f(res)}° per count.`,
    };
  },
};

const loadErrorCalc: CalculationQuestion = {
  id: 'm05.calc.load-error',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m05.lo1', 'm05.lo4'],
  generate(seed) {
    const rng = mulberry32(seed);
    const ra = randStep(rng, 1, 4, 0.5);
    const kphi = randStep(rng, 0.05, 0.2, 0.05);
    const kp = pick(rng, [2, 5, 10, 20]);
    const kfb = pick(rng, [0.5, 1, 2]);
    const tl = randStep(rng, 0.02, 0.2, 0.01);
    const e = positionServoLoadError(tl, ra, kp, kfb, kphi);
    return {
      stem: `Extension. A DC position servo has a proportional amplifier of gain Kp = ${kp} V/V, a position sensor of ${kfb} V/rad and a motor with Ra = ${f(ra)} Ω and kφ = ${f(kphi)} N·m/A. It holds a constant load torque of ${f(tl)} N·m at rest. Find the steady position error, in degrees.`,
      answer: radToDeg(e),
      unit: '°',
      relativeTolerance: TOL,
      explanation: `At rest kφ·Ia = TL, so Ia = ${f(tl / kphi)} A and Va = Ra·Ia = ${f((ra * tl) / kphi)} V. Va = Kp·Kfb·e gives e = TL·Ra/(Kp·Kfb·kφ) = ${f(e)} rad = ${f(radToDeg(e))}°.`,
    };
  },
};

const overshootCalc: CalculationQuestion = {
  id: 'm05.calc.overshoot',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m05.lo4'],
  generate(seed) {
    const rng = mulberry32(seed);
    const kp = pick(rng, [5, 8, 10, 15, 20, 30]);
    const s = positionServoSecondOrder(kp, 1, 0.1, 2, 1e-4, 1e-4);
    return {
      stem: `Extension. A position servo (La neglected) has Kp = ${kp} V/V, Kfb = 1 V/rad, Ra = 2 Ω, kφ = 0.1 N·m/A, J = 1×10⁻⁴ kg·m² and B = 1×10⁻⁴ N·m·s/rad. Find the percentage overshoot of its step response.`,
      answer: 100 * s.overshoot,
      unit: '%',
      relativeTolerance: TOL,
      explanation: `K = Kp·Kfb·kφ/Ra = ${f(s.stiffness)} N·m/rad; ωn = √(K/J) = ${f(s.naturalFrequency)} rad/s; ζ = (B + kφ²/Ra)/(2√(K·J)) = ${f(s.dampingRatio)}; Mp = exp(−πζ/√(1 − ζ²)) = ${f(100 * s.overshoot)} %.`,
    };
  },
};

export const M05_QUESTIONS: readonly Question[] = [
  driveSignalMcq,
  encoderLinesCalc,
  servoStepperMcq,
  encoderCountCalc,
  acServoMcq,
  resolutionCalc,
  resolverMcq,
  loadErrorCalc,
  overshootCalc,
  huntingTs,
];
