/**
 * M04 Stepper Motors — English content (D5). Notation from LN Ch2 Part I and
 * Tutorial 3. Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M04_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm04.lo1',
    courseLo: 'LO1',
    text: 'Explain how a stepper motor turns electrical pulses into discrete steps, and compare variable-reluctance, permanent-magnet and hybrid motors.',
  },
  {
    id: 'm04.lo2',
    courseLo: 'LO1',
    text: 'Calculate the step angle from the stator and rotor tooth counts, and the pulses per revolution, pulse rate, time per step and speed.',
  },
  {
    id: 'm04.lo3',
    courseLo: 'LO1',
    text: 'Construct the phase-sequence table for wave, normal (two-phase-on) and half-step drive in either direction.',
  },
  {
    id: 'm04.lo4',
    courseLo: 'LO2',
    text: 'Carry out the virtual experiments: step the motor, record position and speed, and relate them to the pulse rate and drive mode.',
  },
];

export const M04_THEORY = {
  intro:
    'A stepper motor turns one electrical pulse into one fixed angular step. Energising the stator phases in sequence pulls the nearest rotor teeth into line, so the position is set by counting pulses and the speed by the pulse rate, without a position sensor. The order of the phases sets the direction.',
  equationsTitle: 'Equations (course notation)',
  equations: [
    'Step angle (variable reluctance): Sa = (Ns − Nr)/(Ns × Nr) × 360°   (Ns stator poles, Nr rotor teeth)',
    'Number of phases (VR): m = Ns/(Ns − Nr)   e.g. 6/4 → 3 phases, 30° per step',
    'Pulses per revolution: PPR = 360°/Sa;   pulses for an angle = angle/Sa',
    'Speed: N = Sa × PR × 60/360 = Sa × PR/6 = PR × 60/PPR   (N in rpm, PR in pulses/s)',
    'Time per step = 1/PR',
    'Half step: angle per pulse Sa/2 and PPR doubles; the speed at the same PR halves',
  ],
  typesTitle: 'Types of stepper motor',
  types: [
    'Variable reluctance (VR): soft-iron toothed rotor, no magnet. Large step angle, no detent torque when unpowered, cheapest. The course lab motor is a 3-phase 6/4 VR motor (30° step).',
    'Permanent magnet (PM): magnetised rotor, typically 7.5°–15° (24–48 steps per revolution). Has detent torque (about one tenth of the holding torque) with the power off.',
    'Hybrid: an axial magnet between two toothed soft-iron rotor cups; small steps of 0.9°–3.6° (100–400 steps per revolution) and high torque. Its step angle comes from the datasheet: the course formula above is for VR motors.',
  ],
  drivesTitle: 'Drive modes',
  drives: [
    'Wave drive (full step, one phase on): A, B, C, A, … Each pulse turns the rotor one step angle.',
    'Normal drive (full step, two phases on): AB, BC, CA, … The rotor rests midway between two phases and gives more torque on a two-phase motor.',
    'Half step: one and two phases on alternately (A, AB, B, BC, …). Twice as many positions; the torque varies from step to step.',
    'Reversing the order of the sequence (A, C, B, …) reverses the direction of rotation.',
    'Unipolar drive: centre-tapped coils; each half-coil is switched on in one direction only (four coil signals A, Ā, B, B̄). Bipolar drive: each whole coil is reversed by an H-bridge (signals ±).',
    'Microstepping (extension): a bipolar driver sets the two coil currents to cosine and sine values, dividing each full step into 2, 4, 8 or 16 microsteps (driver resolution table).',
  ],
  torqueTitle: 'Torque and limits',
  torque:
    'Holding torque is the torque that resists turning while a phase is energised; detent torque is the smaller holding torque of an unpowered PM or hybrid motor. The available torque falls as the pulse rate rises, so a motor started too fast, or with too much load, misses steps and loses its position. The model here has an ideal rotor unless "Rotor dynamics" is switched on.',
  prosConsTitle: 'Advantages and disadvantages',
  prosCons: [
    'Advantages: open-loop position control by counting pulses; full torque at standstill; precise, repeatable steps; simple, reliable and inexpensive.',
    'Disadvantages: resonance and step loss if overloaded or driven too fast; low efficiency (current flows even at rest); torque falls at high speed.',
  ],
};

export const M04_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm04.act.stepAngle',
    level: 'beginner',
    guided: true,
    title: 'Step angle from the tooth counts',
    outcomeIds: ['m04.lo2'],
    steps: [
      'Load the course lab motor (VR 6/4). Calculate Sa = (Ns − Nr)/(Ns·Nr) × 360° and m = Ns/(Ns − Nr) by hand, then compare with the readings.',
      'Change to Ns = 12, Nr = 8 (Tutorial 3 Q2), then Ns = 8, Nr = 6. Record a row for each motor.',
      'From the 6/4 motor, try Nr = 8 (Ns < Nr), then Nr = 4 with Ns = 7. Read the messages: why is each combination rejected?',
    ],
  },
  {
    id: 'm04.act.sequence',
    level: 'beginner',
    guided: true,
    title: 'Phase-sequence tables (lab preliminary study)',
    outcomeIds: ['m04.lo3', 'm04.lo1'],
    steps: [
      'Load the VR 6/4 motor. Set the pulse rate to 2 pulses/s and the number of pulses to 6.',
      'Choose wave drive and press Start. Watch which phase is lit at each step and where the rotor marker points. Write the table: step, phase(s), angle.',
      'Reset, choose normal drive (two phases on) and repeat. Where does the rotor rest compared with wave drive?',
      'Repeat with half step. Compare your three tables with the sequence table shown beside the readings.',
    ],
  },
  {
    id: 'm04.act.direction',
    level: 'beginner',
    guided: true,
    title: 'Clockwise and anticlockwise',
    outcomeIds: ['m04.lo3'],
    steps: [
      'With wave drive, run 6 pulses clockwise and note the phase order.',
      'Reset, choose anticlockwise and run again. What happens to the phase order and to the angle?',
      'Change the direction while the motor is running and watch the position trace.',
    ],
  },
  {
    id: 'm04.act.speed',
    level: 'intermediate',
    guided: true,
    title: 'Speed and pulse rate',
    outcomeIds: ['m04.lo2', 'm04.lo4'],
    steps: [
      'VR 6/4, continuous pulses (number of pulses 0). Find the pulse rate for 100 rpm with PR = 6N/Sa (Tutorial 3 Q5), set it, run and record a row.',
      'Record rows at four other pulse rates. Check N = Sa·PR/6 and time per step = 1/PR for each.',
      'Open the report: the graph shows speed against pulse rate from your rows. What is its slope?',
    ],
  },
  {
    id: 'm04.act.half',
    level: 'intermediate',
    guided: false,
    title: 'Half step and microstepping on a hybrid motor',
    outcomeIds: ['m04.lo2', 'm04.lo3'],
    steps: [
      'Load the hybrid motor (1.8°). At 500 pulses/s, find the speed in full step and in half step (course MCQ set: 150 and 75 rpm).',
      'Choose microstepping with 16 microsteps. How many pulses per revolution are needed, and what pulse rate gives 60 rpm?',
      'Compare the coil currents in the timing diagram for full step, half step and microstepping.',
    ],
  },
  {
    id: 'm04.act.dynamics',
    level: 'advanced',
    guided: false,
    title: 'Rotor dynamics: oscillation, load angle and lost steps (extension)',
    outcomeIds: ['m04.lo1', 'm04.lo4'],
    steps: [
      'Switch on rotor dynamics with the VR 6/4 motor at 2 pulses/s. Describe the rotor motion after each step.',
      'Add a load torque of 0.1 N·m. Where does the rotor rest? Compare with the load angle asin(TL/Tpk)/Nr.',
      'Load the hybrid motor with 0.2 N·m and raise the pulse rate. At what rate are steps lost? Why does a real system ramp the pulse rate up gradually?',
    ],
  },
];

export const M04_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    'Tooth counts and pulse rates follow the course; torque, inertia and damping are typical values, not bench data.',
  presets: 'Motor',
  presetVr64: 'VR 6/4 (course lab)',
  presetVr128: 'VR 12/8 (Tutorial 3)',
  presetPm: 'PM 7.5°',
  presetHybrid: 'Hybrid 1.8°',
  family: 'Motor type',
  families: { vr: 'Variable reluctance (VR)', pm: 'Permanent magnet (PM)', hybrid: 'Hybrid' },
  statorTeeth: 'Stator poles Ns',
  rotorTeeth: 'Rotor teeth Nr',
  stepsPerRev: 'Full steps per revolution',
  partsTitle: 'Construction',
  partsHint: 'Choose a part to highlight it in the diagram.',
  parts: [
    {
      id: 'stator',
      label: 'Stator frame',
      text: 'The stationary iron frame. It carries the stator poles and completes the magnetic path.',
    },
    {
      id: 'poles',
      label: 'Stator poles and windings',
      text: 'Each pole carries a coil. Opposite poles belong to the same phase; energising a phase magnetises its poles. A filled pole is energised.',
    },
    {
      id: 'rotor',
      label: 'Rotor',
      text: 'The rotating part on the shaft. In a VR motor it is toothed soft iron; in PM and hybrid motors it is magnetised. Its teeth line up with the energised poles.',
    },
    {
      id: 'marker',
      label: 'Rotor marker',
      text: 'The dark tooth and line show the rotor position, so each step can be followed.',
    },
    { id: 'shaft', label: 'Shaft', text: 'Delivers the stepped motion to the load.' },
  ],
  hybridTeeth: 'Hybrid rotor teeth Nr',
  hybridNote:
    'Two-phase hybrid (extension): Sa = 360°/(4·Nr), so full steps per revolution = 4·Nr. The course formula Sa = (Ns − Nr)/(Ns·Nr) × 360° is for variable-reluctance motors and does not apply to a hybrid.',
  mode: 'Drive mode',
  modes: {
    wave: 'Wave (full step, one phase on)',
    normal: 'Normal (full step, two phases on)',
    half: 'Half step',
    micro: 'Microstepping (extension)',
  },
  microsteps: 'Microsteps per full step',
  coilDrive: 'Coil drive',
  coilDrives: { unipolar: 'Unipolar (centre-tapped)', bipolar: 'Bipolar (H-bridge)' },
  direction: 'Direction',
  cw: 'Clockwise',
  ccw: 'Anticlockwise',
  pulseRate: 'Pulse rate PR',
  pulseLimit: 'Number of pulses (0 = continuous)',
  dynamicsTitle: 'Rotor dynamics (extension)',
  rotorDynamics: 'Simulate rotor dynamics',
  peakTorque: 'Holding torque per phase Tpk',
  inertia: 'Inertia J',
  damping: 'Damping B',
  loadTorque: 'Load torque TL',
  liveHint:
    'Pulse rate, direction and load can be changed while the motor runs; the motor and drive mode only after Reset.',
  diagram: 'Motor cross-section (rotor drawn at its simulated angle)',
  diagramTwoPhase:
    'Schematic: the four stator poles show the coil currents; the rotor marker is drawn at the simulated angle.',
  phasesLit: 'Phase states',
  sequenceTitle: 'Phase sequence (from the model)',
  sequenceCaption:
    'The first steps of the present drive mode and direction. The current step is highlighted.',
  step: 'Step',
  angle: 'Angle (°)',
  measurements: {
    time: 'Time',
    fullStepAngle: 'Full step angle',
    stepAngle: 'Angle per pulse',
    phases: 'Phases',
    ppr: 'Pulses per revolution',
    pulseRate: 'Pulse rate',
    stepTime: 'Time per step',
    commandSpeedRpm: 'Speed',
    pulses: 'Pulses sent',
    commandAngleDeg: 'Commanded position',
    rotorAngleDeg: 'Rotor position',
    rotorSpeedRpm: 'Rotor speed',
    positionErrorDeg: 'Position error',
    lostSteps: 'Steps lost',
  },
  lostStepsWarning:
    'Steps lost: the rotor has fallen behind by at least one whole electrical cycle. The pulse rate is too high for this load and inertia.',
  timingTitle: 'Timing diagram: phase currents',
  timingDesc:
    'Current in each phase over the last pulses (1 = rated current; − = reversed current on a bipolar coil).',
  positionTitle: 'Position against time',
  positionDesc: 'Commanded position (detent of the present step) and rotor position.',
  speedLineTitle: 'Speed against pulse rate',
  speedLineDesc: 'N = Sa·PR/6 for the present angle per pulse, with the operating point.',
  commanded: 'Commanded',
  rotor: 'Rotor',
};
