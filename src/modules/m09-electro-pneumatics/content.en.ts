/**
 * M09 Electro-pneumatics — English content (D5). Centred on course Lab 3
 * (Festo TP201). Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M09_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm09.lo1',
    courseLo: 'LO1',
    text: 'Explain push buttons, relays, solenoid valves, limit switches and proximity sensors in a 24 V DC electro-pneumatic control circuit.',
  },
  {
    id: 'm09.lo2',
    courseLo: 'LO1',
    text: 'Design relay ladder (current-path) diagrams for direct and indirect control, OR and AND, latching and sequences.',
  },
  {
    id: 'm09.lo3',
    courseLo: 'LO2',
    text: 'Operate the Lab 3 circuits (Parts A–D), build circuits of your own and verify their sequence.',
  },
  {
    id: 'm09.lo4',
    courseLo: 'LO2',
    text: 'Find faults in an electro-pneumatic circuit by observing its behaviour and the states of its signals.',
  },
];

export const M09_THEORY = {
  intro:
    'In electro-pneumatics the signals are electrical (24 V DC) and the power is pneumatic. Push buttons and sensors feed a relay circuit; the relays switch the solenoids of valves, which switch the air to the cylinders.',
  elementsTitle: 'Elements',
  elements: [
    'Push button: a spring-return switch with a normally-open (NO) or normally-closed (NC) contact. A selector switch stays where it is set.',
    'Relay: a coil (K1) moves several changeover contacts. One small signal can switch several circuits, and the relay contacts carry more current (5 A) than a push button (2 A).',
    'Solenoid valve: the coil (1M1) switches the valve. Single solenoid with spring return: back to rest when the current stops (safe on power failure). Double solenoid (1M1, 1M2): keeps its position (memory).',
    'Sensors: mechanical limit switches, magnetic reed and electronic proximity switches on the cylinder (1B1 retracted, 1B2 extended), optical sensors. A sensor closes its contact when its end position is reached.',
    'Timer (on-delay): its contact closes a set time after its coil is energised.',
  ],
  ladderTitle: 'Ladder (current-path) diagrams',
  ladder: [
    'Each rung runs from +24 V to 0 V: contacts in series give AND, contacts in parallel give OR, an NC contact gives NOT; the rung ends at one coil.',
    'Direct control: the push button switches the solenoid itself. Indirect control: the push button switches a relay, whose contact switches the solenoid.',
    "Latching (self-holding): a relay contact in parallel with the set button keeps the relay on. With the reset button's NC contact in series with both, reset is dominant; with it only in the hold branch, set is dominant.",
    'Sequences use the sensors as conditions: the next movement starts when the previous one has reached its end position (e.g. 1A1+ 2A1+ 1A1− 2A1−).',
  ],
  electricalTitle: 'Electrical values',
  electrical: [
    'Coil current I = U/R and power P = U·I = U²/R: a 48 Ω coil at 24 V draws 0.5 A (12 W); a 580 Ω relay coil about 41 mA.',
    'A push button is rated about 2 A, a relay contact about 5 A: switching several solenoids directly from a push button can overload it — another reason for indirect control.',
  ],
};

export const M09_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm09.act.ab',
    level: 'beginner',
    guided: true,
    title: 'Parts A and B: direct and indirect control',
    outcomeIds: ['m09.lo1', 'm09.lo3'],
    steps: [
      'Load Part A. Start, hold S1 and release it. Read the current through S1.',
      'Load Part B. Repeat. Which current does S1 carry now? Why is indirect control used?',
      'Simulate a power failure (fault "supply") while the cylinder is extended. What happens, and why is that safe?',
    ],
  },
  {
    id: 'm09.act.c',
    level: 'beginner',
    guided: true,
    title: 'Part C: OR control of a single-acting cylinder',
    outcomeIds: ['m09.lo2', 'm09.lo3'],
    steps: [
      "Load Part C. At rest, which way is 2A1? Press S1, then S2. Explain using the valve's rest position.",
      'Change the ladder so that both buttons are needed (AND). Test it.',
    ],
  },
  {
    id: 'm09.act.latch',
    level: 'intermediate',
    guided: true,
    title: 'Latching: dominant reset and dominant set',
    outcomeIds: ['m09.lo2'],
    steps: [
      'Load "Latch (reset dominant)". Press S1 briefly, then S2. Then press both together.',
      'Edit the ladder to make set dominant (move the NC S2 contact into the hold branch only). Test both buttons together again.',
    ],
  },
  {
    id: 'm09.act.d',
    level: 'intermediate',
    guided: false,
    title: 'Part D: sequence 1A1+ 2A1+ 1A1− 2A1−',
    outcomeIds: ['m09.lo2', 'm09.lo3'],
    steps: [
      'Load Part D. Press S1 and keep it pressed until 2A1 is out, then release. Write the order of the movements.',
      'Draw the displacement-step diagram from the position chart. Explain the job of each rung.',
    ],
  },
  {
    id: 'm09.act.timer',
    level: 'intermediate',
    guided: false,
    title: 'Timer and continuous cycling',
    outcomeIds: ['m09.lo1', 'm09.lo2'],
    steps: [
      'Load "Timed return". Press S1 briefly. How long does 1A1 stay extended? Change the timer setting.',
      'Load "Continuous cycle" and hold S1. What stops the cycle?',
    ],
  },
  {
    id: 'm09.act.faults',
    level: 'advanced',
    guided: false,
    title: 'Troubleshooting: find the hidden fault',
    outcomeIds: ['m09.lo4'],
    steps: [
      'Load Part D and press "Insert a hidden fault". Operate the circuit and watch the lamps for S1, the sensors, the relays and the solenoids.',
      'Choose your diagnosis and check it. Explain which observation pointed to the fault.',
    ],
  },
];

export const M09_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    "Festo TP201 equipment; coil values from the Festo examples (48 Ω solenoid, 580 Ω relay). The cylinder speed model is VADL's own.",
  presets: 'Lab 3 circuits',
  presetNames: {
    partA: 'Part A: direct',
    partB: 'Part B: indirect',
    partC: 'Part C: OR, single-acting',
    partD: 'Part D: sequence',
    latch: 'Latch (reset dominant)',
    timer: 'Timed return',
    cycle: 'Continuous cycle',
  },
  operate: 'Push buttons',
  coils: 'Relays and solenoids',
  sensors: 'Sensors',
  valve1: '1V1 valve for 1A1',
  valve1s: {
    single: '5/2 single solenoid (1M1), spring return',
    double: '5/2 double solenoid (1M1, 1M2), memory',
  },
  valve2: 'Valve for 2A1 (2M1)',
  valve2s: { nc: '3/2 normally closed: 2M1 extends', no: '5/2 on port 2: 2M1 retracts (Part C)' },
  timerDelay: 'Timer T1 delay',
  supply: 'Working pressure',
  throttle: 'Flow control opening',
  liveHint:
    'Buttons, pressure and flow control can be changed while running; the ladder and valves only after Reset.',
  ladderTitle: 'Ladder diagram (conducting rungs bold, closed contacts marked)',
  editorTitle: 'Edit the ladder (connection activity)',
  rung: 'Rung',
  branch: 'Branch',
  coil: 'Coil',
  addContact: 'Add contact',
  removeContact: 'Remove last contact',
  addBranch: 'Add parallel branch',
  removeBranch: 'Remove branch',
  addRung: 'Add rung',
  removeRung: 'Remove rung',
  emptyBranch: '(direct connection)',
  faultTitle: 'Troubleshooting',
  faultVisible: 'Fault (shown)',
  faults: {
    none: 'No fault',
    supply: '24 V supply lost',
    'S1-contact': 'S1 contact does not close',
    '1B2-sensor': 'Sensor 1B2 defective',
    '2B2-sensor': 'Sensor 2B2 defective',
    'K1-coil': 'Relay K1 coil open',
    'K1-welded': 'Relay K1 contact welded closed',
    '1M1-coil': 'Solenoid 1M1 coil open',
    'rung1-wire': 'Broken wire in rung 1',
  },
  hiddenFault: 'Insert a hidden fault',
  diagnosis: 'Your diagnosis',
  checkDiagnosis: 'Check diagnosis',
  clearFault: 'Remove the fault',
  hiddenActive: 'A hidden fault is active. Operate the circuit and diagnose it.',
  diagnosisRight: 'Correct: that is the fault.',
  diagnosisWrong: 'Not this one. Look again at which lamp fails to light.',
  chatter: 'The circuit does not settle (a relay switches itself off): check the ladder.',
  overload: 'S1 carries more than its 2 A rating: use a relay (indirect control).',
  measurements: {
    x1: '1A1 position',
    x2: '2A1 position',
    supplyCurrent: 'Supply current',
    s1Current: 'Current through S1',
    timer: 'Timer elapsed',
  },
  positionTitle: 'Cylinder positions against time (displacement-step diagram)',
  positionDesc: 'Positions of 1A1 and 2A1.',
};
