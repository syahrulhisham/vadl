/**
 * M02 AC Motor Drives — English content (D5). Notation follows "AC Drives new"
 * and LN Ch1 Part IV. Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M02_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm02.lo1',
    courseLo: 'LO1',
    text: 'Explain the rotating magnetic field, synchronous speed and slip of a three-phase induction motor.',
  },
  {
    id: 'm02.lo2',
    courseLo: 'LO1',
    text: 'Use the approximate equivalent circuit to calculate rotor current, torque, power flow and efficiency.',
  },
  {
    id: 'm02.lo3',
    courseLo: 'LO1',
    text: 'Analyse speed control by stator voltage, rotor resistance, constant V/f and frequency above base speed.',
  },
  {
    id: 'm02.lo4',
    courseLo: 'LO2',
    text: 'Carry out the virtual experiments, record measurements and interpret torque–speed curves.',
  },
];

export const M02_THEORY = {
  intro:
    'Three-phase stator currents produce a magnetic field that rotates at synchronous speed Ns = 120f/p. The rotor turns slightly slower; the difference, the slip, induces rotor currents that produce torque. A motor at synchronous speed produces no torque.',
  equationsTitle: 'Equations (course notation)',
  equations: [
    'Synchronous speed: Ns = 120f/p,   ωs = 2ω/p = 4πf/p (mechanical)',
    'Slip: S = (ωs − ωm)/ωs = (Ns − N)/Ns,   rotor frequency fr = S·f',
    "Rotor current: Ir' = Vs / √[(Rs + Rr'/S)² + (Xs + Xr')²]   (Vs per phase)",
    "Air-gap power: Pg = 3·Ir'²·Rr'/S;   torque Td = Pg/ωs",
    "Developed power Pd = Pg(1 − S);   rotor copper loss = S·Pg;   stator copper loss = 3·Ir'²·Rs",
    "Maximum torque at Smax = Rr'/√[Rs² + (Xs + Xr')²]:   Tmax = 3Vs² / {2ωs[Rs + √(Rs² + (Xs + Xr')²)]}",
    "Starting torque (S = 1): Tst = 3Rr'Vs² / {ωs[(Rs + Rr')² + (Xs + Xr')²]}",
    "Low slip: Td ≈ 3Vs²S/(ωs·Rr')",
  ],
  controlTitle: 'Speed-control methods',
  control: [
    'Stator-voltage control: Vs = b·Vrated, torque ∝ b². Simple (AC voltage controller), but a narrow speed range and high rotor losses; best for fan loads.',
    "Rotor-resistance control (wound rotor): adding Rx' shifts Smax up, raising starting torque and lowering speed for a given load. Torque depends on Rr'/S, so doubling the rotor resistance doubles the slip at the same torque. In practice a chopper varies Re = R(1 − k).",
    'Constant V/f: below base frequency the voltage is reduced in proportion, keeping the flux constant; with Rs = 0 the maximum torque stays the same.',
    'Frequency at constant voltage (above base): ωs = β·ωb; the flux falls and Tmax ∝ 1/β² (field weakening).',
  ],
  regionsTitle: 'Operating regions',
  regions:
    'Motoring 0 < S < 1; regenerating (generating) S < 0, above synchronous speed; plugging 1 < S < 2, running against the field.',
  circuitTitle: 'Equivalent circuit used',
  circuit:
    "The course approximate circuit moves the magnetising reactance Xm to the supply terminals; Rs, Xs, Xr' and Rr'/S are in series. Input impedance Zi = jXm ∥ (Rs + Rr'/S + j(Xs + Xr')).",
};

export const M02_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm02.act.slip',
    level: 'beginner',
    guided: true,
    title: 'Synchronous speed and slip',
    outcomeIds: ['m02.lo1'],
    steps: [
      'Load the "Performance" preset (460 V, 60 Hz, 4 poles). Predict Ns before starting.',
      'Start the motor. Watch the rotating-field view: the rotor marker slips behind the field.',
      'At steady state record a row. Check S = (Ns − N)/Ns and the rotor frequency fr = S·f.',
      'Change the number of poles to 6 (after Reset) and repeat. How does Ns change?',
    ],
  },
  {
    id: 'm02.act.performance',
    level: 'intermediate',
    guided: true,
    title: 'Performance from the equivalent circuit',
    outcomeIds: ['m02.lo2', 'm02.lo4'],
    steps: [
      'Load "Performance" and run to steady state (about 1750 rpm). Record a row.',
      'Calculate Ir′, Pg, Td and the efficiency by hand from the circuit values shown in the parameters, and compare with the readouts.',
      'Check the power balance: input power = air-gap power + stator copper loss.',
      'Read Tmax, Smax and Tst. Can this motor start a constant load of 100 N·m? Try it.',
    ],
  },
  {
    id: 'm02.act.stator-voltage',
    level: 'intermediate',
    guided: true,
    title: 'Stator-voltage control of a fan',
    outcomeIds: ['m02.lo3'],
    steps: [
      'Load "Stator voltage" (fan load, b = 0.52). Run and record: the speed should settle near 1550 rpm.',
      'Change b to 0.6, 0.7, 0.8 and 1.0 while running; record each time.',
      'Plot speed against b. Why does this method suit fans but not constant-torque loads?',
    ],
  },
  {
    id: 'm02.act.vf',
    level: 'advanced',
    guided: true,
    title: 'Constant V/f and frequency above base',
    outcomeIds: ['m02.lo3'],
    steps: [
      'Load "V/f" at 30 Hz. Record the speed and the maximum torque Tmax.',
      'Change the frequency to 45 and 60 Hz while running; record each. Is Tmax constant?',
      'Load "Above base" (142.3 Hz, constant voltage). Check Tmax ≈ 35 N·m and compare with 196.9 N·m at 60 Hz: Tmax ∝ 1/β².',
    ],
  },
  {
    id: 'm02.act.rotor-resistance',
    level: 'advanced',
    guided: false,
    title: 'Rotor resistance for speed control (independent)',
    outcomeIds: ['m02.lo3', 'm02.lo4'],
    steps: [
      'Load "Rotor resistance". Design a test that shows how the external resistance changes speed, starting torque and efficiency.',
      'Record enough rows to plot speed and efficiency against Rx′. Explain where the extra power goes.',
    ],
  },
];

export const M02_LABELS = {
  presets: 'Presets',
  presetPerformance: 'Performance',
  presetStatorVoltage: 'Stator voltage',
  presetRotorResistance: 'Rotor resistance',
  presetVf: 'V/f',
  presetAboveBase: 'Above base',
  control: 'Control method',
  controls: {
    dol: 'Direct on line (rated V and f)',
    'stator-voltage': 'Stator-voltage control',
    'rotor-resistance': 'Rotor-resistance control',
    vf: 'Constant V/f (variable frequency)',
    frequency: 'Frequency at constant voltage',
  },
  poles: 'Number of poles p',
  ratedLineVoltage: 'Rated line voltage',
  ratedFrequency: 'Rated frequency',
  voltageFactor: 'Voltage factor b',
  frequency: 'Supply frequency f',
  externalRotorResistance: "External rotor resistance Rx'",
  machineTitle: 'Equivalent circuit (per phase, at rated frequency)',
  rs: 'Stator resistance Rs',
  rr: "Rotor resistance Rr'",
  xs: 'Stator reactance Xs',
  xr: "Rotor reactance Xr'",
  xm: 'Magnetising reactance Xm',
  loadTitle: 'Load and mechanics',
  loadExponent: 'Load type k',
  loadRatedTorque: 'Rated load torque Tr',
  loadRatedSpeedRpm: 'Rated load speed nr',
  loadC: 'Load factor C',
  inertia: 'Inertia J',
  friction: 'Viscous friction B',
  liveHint:
    'Voltage factor, frequency, external resistance and load can be changed while running. Reset to change the motor.',
  measurements: {
    time: 'Time',
    speedRpm: 'Speed',
    syncSpeedRpm: 'Synchronous speed',
    slip: 'Slip',
    rotorFrequency: 'Rotor frequency',
    phaseVoltage: 'Phase voltage',
    torque: 'Developed torque',
    loadTorque: 'Load torque',
    rotorCurrent: 'Rotor current',
    statorCurrent: 'Stator current',
    powerFactor: 'Power factor',
    inputPower: 'Input power',
    airGapPower: 'Air-gap power',
    outputPower: 'Output power',
    efficiency: 'Efficiency',
    maxTorque: 'Maximum torque',
    startingTorque: 'Starting torque',
  },
  fieldView: 'Rotating field, seen from the field',
  fieldViewDesc:
    'The field arrow is drawn fixed; the rotor marker moves backwards at the slip speed Ns − N. At synchronous speed it would stand still.',
  speedTrace: 'Speed against time',
  speedTraceDesc:
    'Rotor speed in rpm over the last few seconds; the synchronous speed is the target it never quite reaches.',
  currentTrace: 'Stator current against time',
  currentTraceDesc:
    'Stator current per phase over the last few seconds; the starting current shows here.',
  characteristic: 'Torque–speed characteristic with the load and the operating point',
  characteristicDesc:
    'Developed torque against speed for the present supply (solid), load torque (dashed) and the present operating point (dot).',
  motorCurve: 'Motor',
  loadCurve: 'Load',
  dataNote:
    'Circuit values are course textbook examples until the UTeM laboratory nameplate data are supplied.',
  openReport: 'Open laboratory report',
  loadTypes: {
    '0': 'k = 0: constant torque',
    '1': 'k = 1: torque ∝ speed',
    '2': 'k = 2: torque ∝ speed² (fan, pump)',
    '-1': 'k = −1: constant power',
  },
};
