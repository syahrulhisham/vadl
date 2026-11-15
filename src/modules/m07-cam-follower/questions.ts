/**
 * M07 question bank (original to VADL). Keys are computed by the sim-core
 * functions verified in tests/reference/cam-follower.test.ts.
 */
import { mulberry32, pick } from '@/features/assessment/rng';
import type {
  ExplanationQuestion,
  CalculationQuestion,
  MultipleChoiceQuestion,
  Question,
  TableQuestion,
} from '@/features/assessment/types';
import {
  CAM_PRESETS,
  camDisplacementTable,
  camMotion,
  degToRad,
  mmToM,
  mToMm,
  rpmToRadPerSec,
  uniformRate,
  type CamParams,
} from '@/sim-core';

const MODULE = 'm07-cam-follower';
const TOL = 0.02;
const f = (v: number, sig = 4) => String(Number(v.toPrecision(sig)));

/** A uniform-velocity programme with angles in whole multiples of 30°. */
function programme(rng: () => number): {
  p: CamParams;
  rise: number;
  dwell: number;
  ret: number;
  lift: number;
} {
  const rise = pick(rng, [90, 120, 150, 180]);
  const dwell = pick(
    rng,
    [0, 30, 60, 90].filter((d) => rise + d + 90 <= 360),
  );
  const ret = pick(
    rng,
    [90, 120, 150, 180].filter((r) => rise + dwell + r <= 360),
  );
  const lift = pick(rng, [12, 15, 18, 20, 24, 30, 36, 40]);
  const p: CamParams = {
    ...CAM_PRESETS.course,
    lift: mmToM(lift),
    riseAngle: degToRad(rise),
    dwellAngle: degToRad(dwell),
    returnAngle: degToRad(ret),
  };
  return { p, rise, dwell, ret, lift };
}

const describe = (rise: number, dwell: number, ret: number, lift: number) =>
  `rises ${lift} mm with uniform velocity over ${rise}°, ${dwell > 0 ? `dwells for ${dwell}°, ` : ''}returns with uniform velocity over ${ret}°${rise + dwell + ret < 360 ? ` and dwells for the remaining ${360 - rise - dwell - ret}°` : ''}`;

const dwellMcq: MultipleChoiceQuestion = {
  id: 'm07.mcq.dwell',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m07.lo1'],
  stem: 'What does the follower do during a dwell?',
  choices: [
    { id: 'a', text: 'It stays still while the cam keeps turning' },
    {
      id: 'b',
      text: 'It rises at constant velocity',
      explanationIfChosen: 'That is a uniform-velocity rise.',
    },
    {
      id: 'c',
      text: 'It returns to the base circle',
      explanationIfChosen: 'That is the return (fall).',
    },
    {
      id: 'd',
      text: 'The cam stops turning',
      explanationIfChosen: 'The cam turns continuously; only the follower rests.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'During a dwell the profile is an arc centred on the camshaft, so the follower displacement does not change: a horizontal line on the displacement diagram.',
};

const knifeMcq: MultipleChoiceQuestion = {
  id: 'm07.mcq.knife',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'beginner',
  outcomeIds: ['m07.lo3'],
  stem: 'Why is a knife-edge follower used only for light loads and low speeds?',
  choices: [
    { id: 'a', text: 'Its sharp point slides on the cam, so it wears quickly' },
    {
      id: 'b',
      text: 'It cannot follow a dwell',
      explanationIfChosen: 'A knife-edge follows any profile, dwells included.',
    },
    {
      id: 'c',
      text: 'It needs a drum cam',
      explanationIfChosen: 'Knife-edge followers are used with plate cams.',
    },
    {
      id: 'd',
      text: 'It moves parallel to the camshaft',
      explanationIfChosen: 'On a plate cam the follower moves at right angles to the camshaft.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'The point contact gives high stress and sliding friction. A roller follower rolls instead, so it suits higher loads and speeds.',
};

const drumMcq: MultipleChoiceQuestion = {
  id: 'm07.mcq.drum',
  moduleId: MODULE,
  kind: 'multiple-choice',
  level: 'intermediate',
  outcomeIds: ['m07.lo3'],
  stem: 'How does the follower of a drum (cylindrical) cam move compared with the follower of a plate cam?',
  choices: [
    { id: 'a', text: 'Parallel to the camshaft, instead of at right angles to it' },
    {
      id: 'b',
      text: 'It rotates with the cam',
      explanationIfChosen: 'The follower reciprocates; only the cam rotates.',
    },
    {
      id: 'c',
      text: 'Exactly the same way',
      explanationIfChosen: 'The groove in a drum cam moves the follower along the axis.',
    },
    {
      id: 'd',
      text: 'Only in uniform velocity',
      explanationIfChosen: 'Any motion law can be cut into a drum cam.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'A drum cam has a groove round a cylinder; a roller in the groove moves along the cylinder axis.',
};

const shockTs: MultipleChoiceQuestion = {
  id: 'm07.ts.shock',
  moduleId: MODULE,
  kind: 'troubleshooting',
  level: 'advanced',
  outcomeIds: ['m07.lo1'],
  stem: 'A uniform-velocity cam runs quietly at low speed, but at high speed the follower knocks at the start and end of each rise and return. What is the cause, and the remedy?',
  choices: [
    {
      id: 'a',
      text: 'The velocity changes suddenly at those points (very large acceleration); use a smoother law such as SHM or cycloidal motion',
    },
    {
      id: 'b',
      text: 'The dwell is too long; shorten it',
      explanationIfChosen: 'Dwells have zero velocity and acceleration: they do not cause knocks.',
    },
    {
      id: 'c',
      text: 'The base circle is too large',
      explanationIfChosen:
        'A larger base circle reduces the pressure angle; it does not cause shocks.',
    },
    {
      id: 'd',
      text: 'The cam turns the wrong way',
      explanationIfChosen: 'The direction does not create sudden velocity changes.',
    },
  ],
  correctChoiceId: 'a',
  explanation:
    'With uniform velocity the follower jumps from rest to full speed instantly; the force needed grows with speed squared. Simple harmonic, uniform acceleration or cycloidal laws change velocity gradually (extension content).',
};

const rateCalc: CalculationQuestion = {
  id: 'm07.calc.rate',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'beginner',
  outcomeIds: ['m07.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const lift = pick(rng, [12, 15, 18, 20, 24, 30, 36, 40, 45, 60]);
    const angle = pick(rng, [90, 120, 135, 150, 180, 210, 240]);
    const rate = mToMm(uniformRate(mmToM(lift), degToRad(angle))) * degToRad(1);
    return {
      stem: `A cam lifts its follower ${lift} mm with uniform velocity over ${angle}° of rotation. Find the rate of rise, in mm per degree.`,
      answer: rate,
      unit: 'mm/°',
      relativeTolerance: TOL,
      explanation: `Rate = lift/angle = ${lift}/${angle} = ${f(rate)} mm per degree; the displacement diagram is a straight line of that slope.`,
    };
  },
};

const displacementCalc: CalculationQuestion = {
  id: 'm07.calc.displacement',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m07.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const { p, rise, dwell, ret, lift } = programme(rng);
    const at = pick(
      rng,
      Array.from({ length: 11 }, (_, i) => 30 * (i + 1)),
    );
    const s = mToMm(camMotion(p, degToRad(at)).s);
    return {
      stem: `A cam ${describe(rise, dwell, ret, lift)}. Find the follower displacement when the cam has turned ${at}°, in mm.`,
      answer: s,
      unit: 'mm',
      relativeTolerance: TOL,
      explanation: `Work along the cycle: rise 0–${rise}°, ${dwell > 0 ? `dwell to ${rise + dwell}°, ` : ''}return to ${rise + dwell + ret}°. At ${at}° the displacement is ${f(s)} mm.`,
    };
  },
};

const velocityCalc: CalculationQuestion = {
  id: 'm07.calc.velocity',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'intermediate',
  outcomeIds: ['m07.lo4'],
  generate(seed) {
    const rng = mulberry32(seed);
    const lift = pick(rng, [15, 20, 25, 30, 40, 50]);
    const angle = pick(rng, [90, 120, 150, 180]);
    const n = pick(rng, [30, 60, 100, 120, 200, 300]);
    const v = uniformRate(mmToM(lift), degToRad(angle)) * rpmToRadPerSec(n);
    return {
      stem: `A cam turning at ${n} rpm lifts its follower ${lift} mm with uniform velocity over ${angle}°. Find the follower velocity during the rise, in mm/s.`,
      answer: mToMm(v),
      unit: 'mm/s',
      relativeTolerance: TOL,
      explanation: `Time for ${angle}° = (${angle}/360) × (60/${n}) = ${f((angle / 360) * (60 / n))} s. v = ${lift} mm ÷ that time = ${f(mToMm(v))} mm/s.`,
    };
  },
};

const shmCalc: CalculationQuestion = {
  id: 'm07.calc.shm',
  moduleId: MODULE,
  kind: 'calculation',
  level: 'advanced',
  outcomeIds: ['m07.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const lift = pick(rng, [20, 24, 30, 40, 50]);
    const angle = pick(rng, [120, 150, 180]);
    const at = pick(
      rng,
      [30, 45, 60, 90].filter((a) => a < angle),
    );
    const p: CamParams = {
      ...CAM_PRESETS.course,
      law: 'shm',
      lift: mmToM(lift),
      riseAngle: degToRad(angle),
      returnAngle: degToRad(360 - angle),
    };
    const s = mToMm(camMotion(p, degToRad(at)).s);
    return {
      stem: `Extension. A cam lifts its follower ${lift} mm with simple harmonic motion over ${angle}°. Find the displacement after ${at}° of rotation, in mm.`,
      answer: s,
      unit: 'mm',
      relativeTolerance: TOL,
      explanation: `s = (h/2)(1 − cos(π·θ/β)) = (${lift}/2)(1 − cos(180° × ${at}/${angle})) = ${f(s)} mm.`,
    };
  },
};

const tableQuestion: TableQuestion = {
  id: 'm07.table.displacement',
  moduleId: MODULE,
  kind: 'table',
  level: 'intermediate',
  outcomeIds: ['m07.lo2'],
  generate(seed) {
    const rng = mulberry32(seed);
    const { p, rise, dwell, ret, lift } = programme(rng);
    const rows = camDisplacementTable(p, 30).map((r) => ({
      key: `${r.angleDeg}°`,
      answer: mToMm(r.displacement),
    }));
    return {
      stem: `A cam ${describe(rise, dwell, ret, lift)}. Tabulate the follower displacement every 30° to draw its displacement diagram.`,
      keyHeader: 'Cam angle',
      valueHeader: 'Displacement (mm)',
      rows,
      absoluteTolerance: 0.1,
      relativeTolerance: 0.02,
      explanation: `Rise rate ${f(lift / rise)} mm/°, return rate ${f(lift / ret)} mm/°; dwells keep the displacement constant.`,
    };
  },
};

const explainQuestion: ExplanationQuestion = {
  id: 'm07.explain',
  moduleId: MODULE,
  kind: 'explanation',
  level: 'beginner',
  outcomeIds: ['m07.lo3'],
  stem: 'Compare knife-edge, roller and flat-faced followers.',
  markingGuide: [
    'Knife-edge: follows any profile exactly but wears quickly; light loads and low speeds.',
    'Roller: rolls on the cam with low friction and wear; used at higher loads and speeds; its centre follows the pitch curve.',
    'Flat-faced: compact and robust (e.g. engine valves); the cam profile must be convex.',
    'All need a spring or gravity to keep contact.',
  ],
};

export const M07_QUESTIONS: readonly Question[] = [
  dwellMcq,
  rateCalc,
  knifeMcq,
  displacementCalc,
  tableQuestion,
  drumMcq,
  velocityCalc,
  shmCalc,
  shockTs,
  explainQuestion,
];
