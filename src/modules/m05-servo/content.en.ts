/**
 * M05 Servo Motors — English content (D5). Course content (LN Ch2 Part II) is
 * qualitative; PID and response metrics are marked as an extension (L-16).
 * Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M05_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm05.lo1',
    courseLo: 'LO1',
    text: 'Describe a servo system as a servo amplifier, motor and feedback sensor, and explain how the drive signal Vcs − Vfc corrects the position or speed.',
  },
  {
    id: 'm05.lo2',
    courseLo: 'LO1',
    text: 'Compare DC (armature-controlled) and AC two-phase servo motors, and servo motors with stepper motors.',
  },
  {
    id: 'm05.lo3',
    courseLo: 'LO1',
    text: 'Explain how a quadrature encoder and a resolver measure shaft position and direction, and calculate encoder counts.',
  },
  {
    id: 'm05.lo4',
    courseLo: 'LO2',
    text: 'Carry out the virtual experiments: compare reference and actual position or speed, and relate the error and response to the amplifier gain and load.',
  },
];

export const M05_THEORY = {
  intro:
    'A servo motor is a motor in a closed loop: a sensor measures the shaft position (or speed), the result is compared with the command, and the servo amplifier drives the motor until the difference is zero. Unlike an open-loop stepper, a servo corrects any error caused by the load.',
  blocksTitle: 'The servo loop (course notation)',
  blocks: [
    'Three blocks: servo amplifier, motor, feedback sensor.',
    'Drive signal = control signal − feedback signal:  Ve = Vcs − Vfc',
    'Position servo: Vcs = Kfb·θref (command), Vfc = Kfb·θ (sensor), so Ve = Kfb(θref − θ)',
    'Speed servo: Vcs = Kt·ωref, Vfc = Kt·ω (tachometer)',
    'Amplifier: Va = Kp·Ve, limited to ±Vmax (the supply)',
    'DC servo motor (formula sheet): Td = J·dω/dt + B·ω + TL;  Eg = kφ·ω;  Td = kφ·Ia;  Va = Ra·Ia + La·dIa/dt + Eg',
  ],
  motorsTitle: 'Servo motors',
  motors: [
    'Design requirements: holding torque at standstill, smooth acceleration in both directions, fast response (low inertia).',
    'DC servo: separately excited (or permanent magnet) with a fixed field; the amplifier controls the armature voltage. It gives high torque at low speed, and reverse torque when the error reverses, which brakes the load near the target.',
    'AC servo: a two-phase motor with a fixed (reference) winding and a control winding. A capacitor shifts the fixed-winding current by about 90°. The control voltage sets the torque; a 0° or 180° control phase sets the direction.',
    'Servo vs stepper: a servo is closed loop (the sensor corrects errors; full torque at speed; needs tuning and an encoder). A stepper is open loop (position by counting pulses; simple and cheap; can lose steps unnoticed).',
  ],
  sensorsTitle: 'Position sensors',
  sensors: [
    'Quadrature encoder: a disc with L lines and two detectors A and B a quarter of a line apart. Counting every edge of A and B gives 4 counts per line (2¾ lines → 11 counts). Resolution = 360°/(4L).',
    'Direction: A leads B in one direction and B leads A in the other. The index Z gives one pulse per revolution, as a reference position.',
    'Resolver: a rotary transformer. Its two outputs have amplitudes proportional to sin θ and cos θ; their signs give the quadrant, and θ = atan2(Vsin, Vcos). A resolver-to-digital converter (RDC) turns them into a number.',
  ],
  extensionTitle: 'Extension: controller and response (not in the course notes)',
  extension: [
    'Proportional amplifier, La neglected: J·θ″ + (B + kφ²/Ra)·θ′ + K·θ = K·θref, K = Kp·Kfb·kφ/Ra.',
    'Natural frequency ωn = √(K/J); damping ratio ζ = (B + kφ²/Ra)/(2√(K·J)); overshoot Mp = exp(−πζ/√(1 − ζ²)).',
    'Holding a load TL with a proportional amplifier leaves a steady error e = TL·Ra/(Kp·Kfb·kφ).',
    'Integral action (Ki) removes the steady error; derivative action (Kd, on the measured speed) adds damping. The integral is held while the amplifier is saturated (anti-windup).',
    'Rise time 10–90 %, overshoot, settling time (±2 %) and steady-state error are measured from the response.',
  ],
};

export const M05_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm05.act.loop',
    level: 'beginner',
    guided: true,
    title: 'The closed loop: Vcs, Vfc and the drive signal',
    outcomeIds: ['m05.lo1', 'm05.lo4'],
    steps: [
      'Load "Position step 90°" and choose 0.1× playback. Before starting, note Vcs, Vfc and Ve.',
      'Press Start. Watch Ve = Vcs − Vfc fall as the shaft turns towards the reference. What is Ve when the shaft stops?',
      'Record a row at the end of the run. Compare the reference and actual position on the chart.',
    ],
  },
  {
    id: 'm05.act.gain',
    level: 'intermediate',
    guided: true,
    title: 'Amplifier gain and the response',
    outcomeIds: ['m05.lo4'],
    steps: [
      'With the position preset, run with Kp = 2, 5 and 20 (Reset between runs). Record a row after each run settles.',
      'Compare the overshoot and settling time in your rows. Why does a higher gain respond faster but overshoot more?',
      'Open the report: the graph shows overshoot against Kp.',
    ],
  },
  {
    id: 'm05.act.load',
    level: 'intermediate',
    guided: true,
    title: 'Holding a load: steady error',
    outcomeIds: ['m05.lo1', 'm05.lo4'],
    steps: [
      'Load "Holding a load" (TL = 0.05 N·m). Run until settled and record the error, Ia and Va.',
      'Check e = TL·Ra/(Kp·Kfb·kφ) by hand. Double Kp and repeat: what happens to the error?',
      'While a run is settled, change the load torque. How does the servo respond?',
    ],
  },
  {
    id: 'm05.act.speed',
    level: 'intermediate',
    guided: false,
    title: 'Speed servo and amplifier saturation',
    outcomeIds: ['m05.lo1', 'm05.lo4'],
    steps: [
      'Load "Speed 100 rad/s". Start and watch the amplifier voltage at the start: why is it held at 24 V?',
      'At steady state, record the speed and the error. Why is the speed below the reference with a proportional amplifier?',
    ],
  },
  {
    id: 'm05.act.sensors',
    level: 'beginner',
    guided: true,
    title: 'Encoder and resolver',
    outcomeIds: ['m05.lo3'],
    steps: [
      'Choose a ramp reference of 1 rad/s and set the encoder to 4 lines. Watch channels A and B and the count: how many counts per line?',
      'Reverse the ramp (−1 rad/s). Which channel leads now? What happens to the count?',
      'Watch the resolver outputs through a full turn. In which quadrant are both negative?',
      'Choose encoder feedback with 4 lines and a position step. Why does the shaft not settle exactly on the reference?',
    ],
  },
  {
    id: 'm05.act.pid',
    level: 'advanced',
    guided: false,
    title: 'Extension: integral and derivative action',
    outcomeIds: ['m05.lo4'],
    steps: [
      'Load "Integral action" (TL = 0.05 N·m, Ki = 50). How long does the error take to reach zero?',
      'With the position preset and Kp = 20, add Kd = 0.02 and then 0.05. Compare the overshoot.',
      'Load "Tracking a sine". Compare the reference and position: how large is the following error?',
    ],
  },
];

export const M05_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    'Motor values are typical for a small DC servo, not bench data. PID and response metrics are an extension.',
  presets: 'Experiment',
  presetNames: {
    position: 'Position step 90°',
    positionLoad: 'Holding a load',
    positionPi: 'Integral action (extension)',
    tracking: 'Tracking a sine',
    speed: 'Speed 100 rad/s',
  },
  mode: 'Servo type',
  modes: { position: 'Position servo', speed: 'Speed servo' },
  reference: 'Reference input',
  references: { step: 'Step', ramp: 'Ramp', sine: 'Sine' },
  referenceDeg: 'Reference position θref',
  referenceRpm: 'Reference speed',
  rampDeg: 'Ramp rate',
  rampRpm: 'Speed ramp rate',
  sineFrequency: 'Sine frequency',
  kp: 'Amplifier gain Kp',
  ki: 'Integral gain Ki (extension)',
  kd: 'Derivative gain Kd (extension)',
  vMax: 'Amplifier limit ±Vmax',
  loadTorque: 'Load torque TL',
  feedback: 'Position sensor',
  feedbacks: { potentiometer: 'Potentiometer (ideal)', encoder: 'Encoder (quantised)' },
  encoderLines: 'Encoder lines L',
  motorTitle: 'Motor and sensors',
  ra: 'Armature resistance Ra',
  la: 'Armature inductance La',
  kphi: 'Motor constant kφ',
  inertia: 'Inertia J',
  friction: 'Friction B',
  positionGain: 'Position sensor gain Kfb',
  tachGain: 'Tachometer gain Kt',
  liveHint:
    'Gains, the load and the reference can be changed while running; the motor values and servo type only after Reset.',
  diagram: 'Servo loop (live values)',
  dial: 'Shaft dial: reference (dashed) and actual position',
  saturated: 'Amplifier saturated: the output is held at ±Vmax.',
  measurements: {
    time: 'Time',
    reference: 'Reference',
    position: 'Position',
    speed: 'Speed',
    error: 'Error',
    vcs: 'Control signal',
    vfc: 'Feedback signal',
    driveSignal: 'Drive signal',
    armatureVoltage: 'Amplifier output',
    armatureCurrent: 'Armature current',
    torque: 'Motor torque',
    encoderCount: 'Encoder count',
    resolverSin: 'Resolver sine output',
    resolverCos: 'Resolver cosine output',
    resolverQuadrant: 'Resolver quadrant',
    riseTime: 'Rise time 10–90 %',
    overshoot: 'Overshoot',
    settlingTime: 'Settling time (±2 %)',
    steadyStateError: 'Steady-state error',
  },
  metricsTitle: 'Step-response measurements (extension)',
  metricsNote:
    'Measured from the recorded response since the step. Settling time shows — until the response stays within ±2 %.',
  channels: 'Encoder channels',
  responseTitle: 'Reference and actual against time',
  responseDesc: 'The command and the measured output of the servo.',
  errorTitle: 'Error against time',
  errorDesc:
    'Error = reference − actual. The drive signal is the same error in volts (×Kfb or ×Kt).',
  amplifierTitle: 'Amplifier output against time',
  amplifierDesc: 'Armature voltage Va from the servo amplifier, limited to ±Vmax.',
  referenceLine: 'Reference',
  actualLine: 'Actual',
};
