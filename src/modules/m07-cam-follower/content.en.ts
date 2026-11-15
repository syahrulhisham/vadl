/**
 * M07 Cam and Follower — English content (D5). Notation from LN Ch3 Part I.
 * The course teaches uniform velocity; other laws are extensions (L-19).
 * Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M07_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm07.lo1',
    courseLo: 'LO1',
    text: 'Explain how a cam converts rotary motion into reciprocating follower motion, and describe rise, dwell and return.',
  },
  {
    id: 'm07.lo2',
    courseLo: 'LO1',
    text: 'Construct the displacement diagram of a uniform-velocity cam at 30° increments and relate it to the cam profile.',
  },
  {
    id: 'm07.lo3',
    courseLo: 'LO1',
    text: 'Compare knife-edge, roller and flat-faced followers, and plate and drum cams.',
  },
  {
    id: 'm07.lo4',
    courseLo: 'LO2',
    text: 'Use the virtual cam to record follower displacement against cam angle and to see how the cam speed sets the follower velocity.',
  },
];

export const M07_THEORY = {
  intro:
    'A cam is a shaped disc or drum that turns; the follower rests on it and rises and falls as the profile passes underneath. A spring or gravity keeps the follower in contact. Cams time and move valves, levers and tools in engines and machines.',
  displacementTitle: 'Displacement diagram (course method)',
  displacement: [
    'The displacement diagram plots the follower displacement (mm) against the cam angle (degrees) over one turn.',
    'Rise: the follower moves away from the cam centre. Dwell: it stays still (the profile is a circular arc). Return (fall): it moves back.',
    'Uniform velocity: the displacement increases by equal amounts for equal angles, so the diagram is a straight line. Rate = lift ÷ rise angle, e.g. 30 mm over 180° = 0.167 mm per degree.',
    'Draw the diagram on a grid divided every 30° (or 45° or 22.5°) and read the displacement at each line.',
    'The cam profile is then drawn on a polar grid: from the base circle, mark each displacement on the radial line of its angle, and join the points.',
    'Follower velocity v = (rate of rise per radian) × cam speed ω.',
  ],
  typesTitle: 'Cams and followers',
  types: [
    'Plate (disc) cam: the profile is the edge of a disc; the follower moves at right angles to the camshaft.',
    'Drum (cylindrical) cam: a groove round a cylinder; the follower moves parallel to the camshaft.',
    'Knife-edge follower: a sharp point; follows any profile exactly but wears quickly; light loads only.',
    'Roller follower: a small wheel rolls on the cam; low friction and wear; the centre follows a pitch curve one roller radius outside the profile.',
    'Flat-faced follower: a flat foot (as on engine valves); compact, but the profile must be convex.',
  ],
  extensionTitle: 'Extension: other motion laws and the pressure angle',
  extension: [
    'Uniform velocity changes speed suddenly at the start and end of the rise and return, which in theory needs infinite acceleration: a shock. Practical cams use smoother laws.',
    'Simple harmonic motion: s = (h/2)(1 − cos πx); smooth velocity, acceleration jumps at the ends.',
    'Uniform acceleration (parabolic): constant acceleration for the first half, constant deceleration for the second.',
    'Cycloidal: s = h[x − sin(2πx)/(2π)]; velocity and acceleration both start and end at zero.',
    'Pressure angle: the angle between the follower axis and the contact normal; above about 30° a follower tends to jam. A larger base circle reduces it.',
  ],
};

export const M07_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm07.act.uniform',
    level: 'beginner',
    guided: true,
    title: 'Uniform velocity: 30 mm rise over 180°',
    outcomeIds: ['m07.lo1', 'm07.lo2'],
    steps: [
      'Load the course example. Calculate the rate of rise in mm per degree and the displacement at every 30°.',
      'Compare with the displacement table. Start the cam and watch the follower rise and fall.',
      'Pause at 90° and at 270° and record a row each time.',
    ],
  },
  {
    id: 'm07.act.dwell',
    level: 'beginner',
    guided: true,
    title: 'Rise, dwell and return',
    outcomeIds: ['m07.lo1', 'm07.lo2'],
    steps: [
      'Load "Rise – dwell – return". Sketch the displacement diagram from the angles and lift before looking at the graph.',
      'Check your sketch against the displacement diagram and the table at 30° steps.',
      'Where on the cam profile are the dwells? What shape is the profile there?',
    ],
  },
  {
    id: 'm07.act.followers',
    level: 'intermediate',
    guided: true,
    title: 'Knife-edge, roller and flat-faced followers',
    outcomeIds: ['m07.lo3'],
    steps: [
      'With the same motion, switch between the three followers. How does the cam profile change?',
      "Why is the roller follower's profile smaller than its pitch curve?",
      'Make the rise steep (60 mm over 60°) with a small base circle: read the warnings for each follower.',
    ],
  },
  {
    id: 'm07.act.speed',
    level: 'intermediate',
    guided: false,
    title: 'Cam speed and follower velocity',
    outcomeIds: ['m07.lo4'],
    steps: [
      'Course example at 60 rpm: calculate the follower velocity during the rise, then check it.',
      'Double the cam speed. What happens to the velocity and to the displacement diagram?',
    ],
  },
  {
    id: 'm07.act.laws',
    level: 'advanced',
    guided: false,
    title: 'Extension: comparing motion laws',
    outcomeIds: ['m07.lo1', 'm07.lo4'],
    steps: [
      'Compare the velocity and acceleration diagrams of uniform velocity, simple harmonic, uniform acceleration and cycloidal motion for the same rise.',
      'Which law would you choose for a high-speed cam, and why?',
    ],
  },
];

export const M07_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    'Uniform velocity is the motion taught in the course; other laws and the pressure angle are an extension.',
  presets: 'Examples',
  presetNames: {
    course: 'Course example (30 mm over 180°)',
    dwells: 'Rise – dwell – return',
    flatShm: 'Flat follower, SHM (extension)',
  },
  law: 'Motion law',
  laws: {
    uniform: 'Uniform velocity (course)',
    shm: 'Simple harmonic (extension)',
    'uniform-acceleration': 'Uniform acceleration (extension)',
    cycloidal: 'Cycloidal (extension)',
  },
  follower: 'Follower',
  followers: { knife: 'Knife-edge', roller: 'Roller', flat: 'Flat-faced' },
  lift: 'Lift h',
  riseAngle: 'Rise angle',
  dwellAngle: 'Dwell angle (at the top)',
  returnAngle: 'Return angle',
  lowerDwell: 'Dwell at the bottom (remainder of the turn)',
  baseRadius: 'Base-circle radius Rb',
  rollerRadius: 'Roller radius Rr',
  camSpeed: 'Cam speed',
  tableStep: 'Table step',
  liveHint: 'The cam speed can be changed while the cam turns; the profile only after Reset.',
  diagram: 'Plate cam and follower (cam drawn at its simulated angle, turning clockwise)',
  segments: ['Rise', 'Dwell (top)', 'Return', 'Dwell (bottom)'],
  measurements: {
    camAngle: 'Cam angle',
    segment: 'Stage of the cycle',
    displacement: 'Follower displacement',
    velocity: 'Follower velocity',
    acceleration: 'Follower acceleration',
    pressureAngle: 'Pressure angle',
    camSpeed: 'Cam speed',
  },
  tableTitle: 'Displacement table',
  tableCaption: 'Follower displacement at each step of cam angle (the course construction).',
  angle: 'Cam angle (°)',
  displacementMm: 'Displacement (mm)',
  diagramTitle: 'Displacement diagram',
  diagramDesc: 'Follower displacement against cam angle over one turn, with the present position.',
  velocityTitle: 'Velocity diagram',
  velocityDesc: 'Follower velocity against cam angle at the present cam speed.',
  accelerationTitle: 'Acceleration diagram (extension)',
  accelerationDesc:
    'Follower acceleration against cam angle. Uniform velocity shows zero inside each segment; at the segment ends it is theoretically infinite.',
};
