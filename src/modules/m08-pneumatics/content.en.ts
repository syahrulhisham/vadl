/**
 * M08 Pneumatics — English content (D5). Centred on course Lab 2 (Festo TP101).
 * Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M08_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm08.lo1',
    courseLo: 'LO1',
    text: 'Explain the operation of single- and double-acting cylinders, 3/2 and 5/2 directional control valves, shuttle and dual-pressure valves, and flow control valves.',
  },
  {
    id: 'm08.lo2',
    courseLo: 'LO1',
    text: 'Calculate cylinder forces from pressure and area, including friction and the return spring.',
  },
  {
    id: 'm08.lo3',
    courseLo: 'LO2',
    text: 'Operate the Lab 2 circuits (direct and indirect control, OR, AND with memory, AND+OR) and describe their sequence.',
  },
  {
    id: 'm08.lo4',
    courseLo: 'LO2',
    text: 'Compare exhaust-air and supply-air flow control and explain why exhaust-air throttling is preferred for double-acting cylinders.',
  },
];

export const M08_THEORY = {
  intro:
    'Compressed air from the service unit (filter, pressure regulator and gauge) is switched by directional control valves to drive cylinders. Pressure acting on the piston area gives the force; the flow of air in and out sets the speed.',
  equationsTitle: 'Force (course notation)',
  equations: [
    'Pressure P = F/A, so F = p·A with A = πD²/4',
    'Retract (annulus) area A′ = π(D² − d²)/4: the retract force is smaller than the extend force',
    'Effective force (Festo): F_eff = p·A − (friction + spring), friction about 10 % of p·A at 4–8 bar',
    'Example (Festo, lab cylinder 20 mm at 6 bar): single-acting with 13.6 N spring 156 N; double-acting 20/8 mm: extend 169.6 N, retract 142.5 N',
  ],
  componentsTitle: 'Components (ISO 1219 names, e.g. 1A1 cylinder, 1V1 valve, 1S1 signal element)',
  components: [
    'Single-acting cylinder: air extends, a spring returns. Double-acting: air both ways.',
    '3/2 valve (three ports, two positions): switches one line between supply and exhaust; normally closed or normally open. 5/2 valve: switches two lines (4 and 2) for a double-acting cylinder.',
    'Actuation: push button, selector switch (detented), roller lever (actuated by the cylinder), pneumatic pilot signal (14 or 12), spring return.',
    'Single-pilot 5/2 valve with spring return: in the rest position when the pilot signal goes. Double-pilot 5/2 valve: keeps its last position (memory) until the opposite pilot signal arrives.',
    'Shuttle valve: OR — output if either input is pressurised. Dual-pressure valve: AND — output only if both are.',
    'One-way flow control: throttles in one direction, free flow in the other. Exhaust-air (meter-out) throttling holds the piston between two air cushions and gives a steadier speed; supply-air (meter-in) throttling makes the speed depend on the load.',
  ],
  controlTitle: 'Direct and indirect control',
  control:
    'Direct control: the signal element (e.g. a push-button 3/2 valve) supplies the cylinder itself — only for small cylinders. Indirect control: the signal element pilots a larger final control valve (e.g. a 5/2 valve) that switches the main air flow.',
  modelTitle: 'How VADL calculates the speed',
  model:
    'The course gives no speed formula. VADL treats the valve passage and the flow control as orifices and finds the speed at which the forces balance and the air can flow in and out (a quasi-static model of its own). It shows the trends — exhaust-air throttling holds a steady speed under load, supply-air throttling slows with load, the exhaust chamber can rise above the supply pressure — but not cushioning or stick-slip.',
};

export const M08_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm08.act.direct',
    level: 'beginner',
    guided: true,
    title: 'Exercise 1: direct and indirect control',
    outcomeIds: ['m08.lo1', 'm08.lo3'],
    steps: [
      'Choose "Direct control". Start, hold push button 1S1 and release it. Describe the cylinder motion.',
      'Choose "Indirect control". Switch the selector 1S1 on and off. Which valve supplies the cylinder? Why use indirect control?',
      'Record the extend and retract forces at 5 and 6 bar and check F = 0.9·p·A.',
    ],
  },
  {
    id: 'm08.act.or',
    level: 'beginner',
    guided: true,
    title: 'Exercise 2: OR with a shuttle valve',
    outcomeIds: ['m08.lo1', 'm08.lo3'],
    steps: [
      'Choose "OR (shuttle valve)". Press 1S1, then 1S2, then both. When does the cylinder extend?',
      'Why can a simple T-connector not replace the shuttle valve?',
    ],
  },
  {
    id: 'm08.act.and',
    level: 'intermediate',
    guided: true,
    title: 'Exercise 3: AND with memory',
    outcomeIds: ['m08.lo1', 'm08.lo3'],
    steps: [
      'Choose "AND with memory". Press 1S1 with the cylinder retracted, then release. What does the double-pilot valve do?',
      'Press 1S1 while the cylinder is extending. Why does nothing happen? Press 1S2 to return it.',
      'Read the gauges 1Z1 and 1Z2 during each stroke and at rest.',
    ],
  },
  {
    id: 'm08.act.andor',
    level: 'intermediate',
    guided: false,
    title: 'Exercise 4: AND + OR, sliding door',
    outcomeIds: ['m08.lo3'],
    steps: [
      'Choose "AND + OR (sliding door)". Press either button briefly at each end. How does one button both open and close the door?',
      'What happens if a button is pressed while the door is moving?',
    ],
  },
  {
    id: 'm08.act.flow',
    level: 'advanced',
    guided: false,
    title: 'Flow control: exhaust-air against supply-air throttling',
    outcomeIds: ['m08.lo4'],
    steps: [
      'In "AND with memory", set the flow control to 20 % with exhaust-air throttling and record the extend time with loads of 0, 50 and 100 N.',
      'Repeat with supply-air throttling. Plot extend time against load for both (the report graph does this from your rows).',
      'Look at the rod-side gauge during an exhaust-throttled stroke with no load: why can it read more than the supply pressure?',
    ],
  },
];

export const M08_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    "Festo TP101 cylinders (20/8 mm, 13.6 N spring); 100 mm stroke assumed. Forces follow the course; the speed model is VADL's own.",
  circuit: 'Lab 2 circuit',
  circuits: {
    direct: 'Exercise 1a: direct control',
    indirect: 'Exercise 1b: indirect control',
    or: 'Exercise 2: OR (shuttle valve)',
    'and-memory': 'Exercise 3: AND with memory',
    'and-or': 'Exercise 4: AND + OR (sliding door)',
  },
  operate: 'Operate',
  s1: '1S1',
  s2: '1S2',
  selector: 'Selector 1S1',
  supply: 'Working pressure (regulator 0Z1)',
  loadForce: 'Load opposing the motion',
  throttle: 'Flow control opening (1V2, 1V3)',
  throttleMode: 'Flow control fitted as',
  throttleModes: {
    'meter-out': 'Exhaust-air (meter-out)',
    'meter-in': 'Supply-air (meter-in)',
    none: 'No flow control',
  },
  cylinderTitle: 'Cylinder',
  bore: 'Bore D',
  rod: 'Rod d',
  stroke: 'Stroke',
  springForce: 'Return spring',
  friction: 'Friction (fraction of p·A)',
  liveHint:
    'Buttons, pressure, load and flow control can be changed while running; the circuit and cylinder only after Reset.',
  diagram: 'Circuit (signals light up when pressurised)',
  cylinder: '1A1',
  signalChainTitle: 'Signal flow',
  valveMemory: '5/2 double-pilot (memory)',
  valve32: '3/2 valve',
  valve52: '5/2 single-pilot, spring return',
  driveExtend: '→ extend',
  driveReturn: '→ return',
  singleActing: 'single-acting',
  doubleActing: 'double-acting',
  on: 'on',
  off: 'off',
  measurements: {
    position: 'Piston position',
    velocity: 'Piston speed',
    capPressure: 'Gauge 1Z1 (cap side)',
    rodPressure: 'Gauge 1Z2 (rod side)',
    extendForce: 'Effective extend force',
    retractForce: 'Effective retract force',
    theoreticalForce: 'Theoretical force p·A',
    extendTime: 'Extend time',
    retractTime: 'Retract time',
  },
  positionTitle: 'Piston position against time',
  positionDesc: 'Position of 1A1 over the last seconds.',
  pressureTitle: 'Chamber pressures against time',
  pressureDesc: 'Gauges 1Z1 (cap side) and 1Z2 (rod side).',
};
