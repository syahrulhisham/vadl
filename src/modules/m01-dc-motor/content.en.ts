/**
 * M01 DC Motor Drives — English content (decision D5: language files per module,
 * so a Malay file can sit beside this one). Notation follows the BELK 3423
 * lecture notes (docs/course-alignment.md §4). Learning outcomes are provisional
 * until confirmed by the lecturer (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M01_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm01.lo1',
    courseLo: 'LO1',
    text: 'Explain how separately excited, shunt and series DC motors work and compare their torque–speed characteristics.',
  },
  {
    id: 'm01.lo2',
    courseLo: 'LO1',
    text: 'Calculate armature current, back-emf, torque, speed and efficiency in steady state, including starting current and starting resistance.',
  },
  {
    id: 'm01.lo3',
    courseLo: 'LO1',
    text: 'Analyse speed control by armature voltage (below base speed) and by field weakening (above base speed).',
  },
  {
    id: 'm01.lo4',
    courseLo: 'LO1',
    text: 'Analyse converter-fed DC drives using single- and three-phase semi, full and dual converters.',
  },
  {
    id: 'm01.lo5',
    courseLo: 'LO2',
    text: 'Carry out the virtual experiments, record measurements and interpret the graphs.',
  },
];

export const M01_THEORY = {
  intro:
    'A DC motor turns electrical power into mechanical power. The field produces a magnetic flux; current in the armature conductors interacts with it to produce torque. As the armature turns it generates a back-emf Eg that opposes the supply, so the current settles to the value the load needs.',
  equationsTitle: 'Equations (course notation)',
  equations: [
    'Armature circuit (steady state): Va = Eg + Ia·Ra',
    'Back-emf: Eg = Kv·If·ω   (series motor, linear magnetics: Eg = Kaf·Ia·ω)',
    'Developed torque: Td = Kv·If·Ia   (series motor: Td = Kaf·Ia²)',
    'Field current: If = Vf / Rf   (shunt motor: Vf = Va)',
    'Speed: ω = (Va − Ia·Ra) / (Kv·If),   n = 60·ω / 2π',
    'Dynamics: Va = Eg + Ia·R + L·dIa/dt,   J·dω/dt = Td − TL − B·ω',
    'Load: TL = C·Tr·(n/nr)^k,   k = 0 constant torque, 1 ∝ speed, 2 fan/pump, −1 constant power',
    'Starting current (Eg = 0): Ia = Va / (Ra + Rst)',
  ],
  convertersTitle: 'Converter supplies (average voltage, continuous current)',
  converters: [
    'Vm = √2·Vrms (single-phase); Vm = peak phase voltage (three-phase)',
    '1-φ half-wave: Va = (Vm/2π)(1 + cos αa)',
    '1-φ semi-converter: Va = (Vm/π)(1 + cos αa)',
    '1-φ full and dual converter: Va = (2Vm/π)·cos αa',
    '3-φ half-wave: Va = (3√3·Vm/2π)·cos αa;  semi: (3√3·Vm/2π)(1 + cos αa);  full: (3√3·Vm/π)·cos αa',
    'Dual converter: converter 2 gives −(2Vm/π)·cos α2 with α1 + α2 = π, so current can reverse (four quadrants).',
  ],
  typesTitle: 'Motor types',
  types: [
    'Separately excited: field from its own supply. Speed falls slightly with load. Speed control by Va (below base speed) and If (above base speed).',
    'Shunt: field across the armature supply, so If = Va/Rf. Behaves like a separately excited motor on a fixed supply.',
    'Series: field in series with the armature, so flux follows the current. Very high starting torque; speed rises steeply at light load — never run unloaded.',
  ],
  quadrantsTitle: 'Four quadrants',
  quadrants:
    'Q1 forward motoring (+ω, +T); Q2 forward braking, regeneration (+ω, −T); Q3 reverse motoring (−ω, −T); Q4 reverse braking (−ω, +T). Semi-converters work in Q1 only; full converters can invert (Va < 0) but cannot reverse current; dual converters reach all four.',
};

export const M01_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm01.act.starting',
    level: 'beginner',
    guided: true,
    title: 'Starting a DC motor',
    outcomeIds: ['m01.lo1', 'm01.lo2'],
    steps: [
      'Load the "Separately excited" preset (Va = 220 V, Ra = 0.5 Ω, Kv·If = 1.2, load 24 N·m).',
      'Set the playback to 0.1× so you can see the start. Press Start and watch the armature current trace.',
      'Note the peak current. Compare it with Va/Ra = 440 A. Why is the peak lower?',
      'When the speed is steady, press Record. Check Ia = 20 A and n ≈ 1671 rpm.',
      'Reset, set the starting resistance Rst to 5 Ω, and start again. How large is the peak current now?',
    ],
  },
  {
    id: 'm01.act.armature-voltage',
    level: 'intermediate',
    guided: true,
    title: 'Speed control by armature voltage',
    outcomeIds: ['m01.lo3', 'm01.lo5'],
    steps: [
      'Load the "Separately excited" preset and press Start.',
      'With the motor running, set Va to 220, 180, 140 and 100 V in turn. Record a row each time the speed is steady.',
      'For each row, check ω = (Va − Ia·Ra)/(Kv·If). Does Ia change with Va? Why not?',
      'Open the report: does the speed against torque graph show the operating points?',
    ],
  },
  {
    id: 'm01.act.field-weakening',
    level: 'intermediate',
    guided: true,
    title: 'Field weakening above base speed',
    outcomeIds: ['m01.lo3'],
    steps: [
      'Load the "Separately excited" preset and set the load torque Tr to 12 N·m.',
      'Start the motor. Record a row at Vf = 220 V (If = 1 A).',
      'Reduce Vf to 165 V and then 110 V while running. Record a row each time.',
      'Explain why the speed rises and why the armature current rises. What limits how far the field can be weakened?',
    ],
  },
  {
    id: 'm01.act.converter',
    level: 'advanced',
    guided: true,
    title: 'Converter-fed drive',
    outcomeIds: ['m01.lo4', 'm01.lo2'],
    steps: [
      'Load the "Converter-fed" preset: two single-phase full converters on 440 V, αf = 0°, αa = 60°.',
      'Run to steady state and record. Check Ia = 45 A and ω ≈ 58.95 rad/s against your own calculation.',
      'Change αa to 30°, 45° and 75° while running and record each. Plot speed against αa.',
      'Change the armature converter to a semi-converter at αa = 60°. Calculate the new Va before you run, then compare.',
      'Find by calculation the αa that gives 500 rpm with the same load, then verify it in the simulation.',
    ],
  },
  {
    id: 'm01.act.series',
    level: 'advanced',
    guided: false,
    title: 'Series motor characteristic (independent)',
    outcomeIds: ['m01.lo1', 'm01.lo5'],
    steps: [
      'Load the "Series" preset. Plan a set of load torques between 10 and 80 N·m.',
      'Record the speed, current and torque for each load at steady state.',
      'Plot speed against torque and compare with the separately excited motor. Why are series motors used for traction and cranes?',
    ],
  },
];

export const M01_LABELS = {
  presets: 'Presets',
  presetSeparatelyExcited: 'Separately excited',
  presetShunt: 'Shunt',
  presetSeries: 'Series',
  presetConverterFed: 'Converter-fed',
  motorType: 'Motor type',
  supply: 'Supply',
  supplyDc: 'DC supply',
  supplyConverter: 'Controlled converter',
  armatureVoltage: 'Armature voltage Va',
  fieldVoltage: 'Field voltage Vf',
  supplyRms: 'Supply voltage Vs (rms; line for 3-φ)',
  armatureConverter: 'Armature converter',
  fieldConverter: 'Field converter',
  alphaArmature: 'Armature firing angle αa',
  alphaField: 'Field firing angle αf',
  rst: 'Starting resistance Rst',
  machineTitle: 'Machine parameters',
  loadTitle: 'Load and mechanics',
  ra: 'Armature resistance Ra',
  la: 'Armature inductance La',
  rf: 'Field resistance Rf',
  kv: 'Motor constant Kv',
  kaf: 'Series constant Kaf',
  rs: 'Series field resistance Rs',
  ls: 'Series field inductance Ls',
  loadC: 'Load factor C',
  loadRatedTorque: 'Rated load torque Tr',
  loadRatedSpeedRpm: 'Rated load speed nr',
  loadExponent: 'Load type k',
  inertia: 'Inertia J',
  friction: 'Viscous friction B',
  liveHint:
    'Supply, firing angles, Rst and load can be changed while the motor runs. Reset to change the motor type, supply or machine.',
  playback: 'Playback speed',
  conductionBlocked:
    'The converter cannot carry negative current: the armature current is held at zero (the motor coasts).',
  motorTypes: {
    'separately-excited': 'Separately excited',
    shunt: 'Shunt',
    series: 'Series',
  },
  converters: {
    'single-half': '1-φ half-wave',
    'single-semi': '1-φ semi-converter',
    'single-full': '1-φ full converter',
    'single-dual': '1-φ dual converter',
    'three-half': '3-φ half-wave',
    'three-semi': '3-φ semi-converter',
    'three-full': '3-φ full converter',
    'three-dual': '3-φ dual converter',
  },
  loadTypes: {
    '0': 'k = 0: constant torque (hoist, pump at constant pressure)',
    '1': 'k = 1: torque ∝ speed (generator into a resistor)',
    '2': 'k = 2: torque ∝ speed² (fan, centrifugal pump)',
    '-1': 'k = −1: constant power (milling, boring)',
  },
  measurements: {
    time: 'Time',
    speedRpm: 'Speed',
    speed: 'Angular speed',
    armatureCurrent: 'Armature current',
    backEmf: 'Back-emf',
    armatureVoltage: 'Armature voltage',
    fieldCurrent: 'Field current',
    torque: 'Developed torque',
    loadTorque: 'Load torque',
    inputPower: 'Input power',
    outputPower: 'Output power',
    efficiency: 'Efficiency',
  },
  speedTrace: 'Speed against time',
  speedTraceDesc: 'Motor speed in rpm over the last few seconds of the run.',
  currentTrace: 'Armature current against time',
  currentTraceDesc:
    'Armature current in amperes over the last few seconds; the starting peak shows here.',
  characteristic: 'Torque–speed characteristic with the load and the operating point',
  characteristicDesc:
    'Steady-state speed of the motor against torque for the present supply and field (solid), the load torque against speed (dashed), and the present operating point (dot). Steady state is where the two cross.',
  motorCurve: 'Motor',
  loadCurve: 'Load',
  activitiesTitle: 'Experiment activities',
  markDone: 'Mark as completed',
  guided: 'Guided',
  independent: 'Independent',
  outcomesTitle: 'Learning outcomes (provisional)',
  assumptionsTitle: 'Model assumptions',
  dataNote:
    'Machine values are textbook-typical until the UTeM laboratory nameplate data are supplied.',
  openReport: 'Open laboratory report',
};
