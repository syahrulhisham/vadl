/**
 * M06 Mechanical Transmission — English content (D5). Notation from LN Ch3
 * Parts I–II and Tutorial 4. Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M06_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm06.lo1',
    courseLo: 'LO1',
    text: 'Calculate the gear ratio, output speed and direction of simple, idler and compound gear trains.',
  },
  {
    id: 'm06.lo2',
    courseLo: 'LO1',
    text: 'Analyse belt and chain drives: velocity ratio from pulley diameters or sprocket teeth, open and crossed belts, and belt torque and power from the belt tensions.',
  },
  {
    id: 'm06.lo3',
    courseLo: 'LO1',
    text: 'Calculate the mechanical advantage, velocity ratio, efficiency, effort and distances of lifting-pulley systems.',
  },
  {
    id: 'm06.lo4',
    courseLo: 'LO2',
    text: 'Use the virtual drive train to record speeds and directions, and explain speed reduction and torque multiplication.',
  },
];

export const M06_THEORY = {
  intro:
    'Gears, belts and chains pass rotation from a driver shaft to a driven shaft. Making the driven wheel larger reduces its speed and increases its torque; the arrangement also sets the direction of rotation.',
  conventionTitle: 'Convention used throughout VADL',
  convention:
    'Gear ratio G = number of teeth on the driven gear ÷ number of teeth on the driver (belts: D_driven ÷ D_driver). The driven speed is N_driven = N_driver ÷ G. G greater than 1 is a speed reduction (for example G = 3 is written 3:1, driver turns three times for one turn of the driven gear). Some lecture slides print the tooth fraction the other way up; the numerical result is the same.',
  equationsTitle: 'Equations (course notation)',
  equations: [
    'Gear ratio: G = T_driven/T_driver;   N_driven = N_driver/G',
    'Belt drive: G = D_driven/D_driver;   N_driven = N_driver × D_driver/D_driven',
    'Compound train: wheels on one shaft turn at the same speed; G_train = G1 × G2 × G3',
    'Direction: each external gear mesh reverses; an idler gear does not change the ratio, so the driven gear turns the same way as the driver; open belts and chains keep the direction; a crossed belt reverses it',
    'Belt torque: T = (T1 − T2)·r;   belt speed v = ω·r;   power P = (T1 − T2)·v   (T1 tight side, T2 slack side)',
    'Lifting pulleys: MA = load/effort;   VR = distance moved by effort/distance moved by load;   efficiency η = MA/VR × 100 %',
    'Ideal lifting pulley: MA = VR = number of rope segments supporting the load',
  ],
  extensionTitle: 'Extension: torque through a train',
  extension: [
    'Speed down means torque up: T_out = η·G·T_in, with efficiency η (1 for an ideal train).',
    'Power in = power out × 1/η: T_in·ω_in = T_out·ω_out/η.',
    'Belt efficiency is typically 90–98 % (flat about 98 %, V-belt 70–96 %); a belt ratio beyond about 3:1 tends to slip.',
  ],
  typesTitle: 'Types of gear, belt and chain',
  types: [
    'Spur gears: straight teeth on parallel shafts. Helical gears: angled teeth, quieter, but they produce an end thrust.',
    'Bevel gears join shafts at an angle (straight, spiral, hypoid). Worm and wheel: large ratios (20:1 to 300:1) and usually self-locking.',
    'Rack and pinion: rotary to linear motion.',
    'Flat, round and V-belts drive by friction and can slip on overload (a safety feature). Timing belts and chains have teeth: no slip, constant ratio.',
    'A crossed belt reverses the direction; it cannot be used with V-belts or timing belts.',
    'Pulleys for lifting: fixed (changes the direction of the effort), movable (MA 2), and combined block and tackle.',
  ],
};

export const M06_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm06.act.pair',
    level: 'beginner',
    guided: true,
    title: 'A simple gear pair',
    outcomeIds: ['m06.lo1'],
    steps: [
      'Load "60T → 30T" (lecture example 1). Predict the speed and direction of B before starting.',
      'Start and compare with the readings. Record a row.',
      'Change the driven gear to 90T and repeat. What is G now, and is it a reduction?',
    ],
  },
  {
    id: 'm06.act.idler',
    level: 'beginner',
    guided: true,
    title: 'The idler gear',
    outcomeIds: ['m06.lo1'],
    steps: [
      'Load "Idler (Tutorial 4 Q4)". Find the speed of the idler and of gear C, and the direction of C.',
      'Change the idler to 50T. What changes, and what stays the same?',
      'Remove the idler (0 teeth). Which way does C turn now?',
    ],
  },
  {
    id: 'm06.act.compound',
    level: 'intermediate',
    guided: true,
    title: 'Compound gear train',
    outcomeIds: ['m06.lo1', 'm06.lo4'],
    steps: [
      'Load "Compound train" (lecture example 4). Work out the speed and direction of D by hand: split the train into pairs.',
      'Run it and check. Record the overall ratio and output speed.',
      'Add a third stage of your own and predict the new output before starting.',
    ],
  },
  {
    id: 'm06.act.belts',
    level: 'intermediate',
    guided: true,
    title: 'Open and crossed belts, and chains',
    outcomeIds: ['m06.lo2'],
    steps: [
      'Load "Belt train A–F". Find the direction and speed of F by hand, then check.',
      'Change the first stage to an open belt. What happens to the direction of F?',
      'Load "Bicycle chain". How many turns does the rear sprocket make per pedal turn?',
    ],
  },
  {
    id: 'm06.act.tension',
    level: 'intermediate',
    guided: false,
    title: 'Belt tensions, torque and power',
    outcomeIds: ['m06.lo2'],
    steps: [
      'Open "Belt tensions". With T1 = 500 N, T2 = 200 N and r = 100 mm at 600 rpm, find the torque, belt speed and power.',
      'Why must T1 be greater than T2? What happens to the power if the slack-side tension rises?',
    ],
  },
  {
    id: 'm06.act.lift',
    level: 'beginner',
    guided: true,
    title: 'Lifting pulleys',
    outcomeIds: ['m06.lo3'],
    steps: [
      'Open "Lifting pulleys". With 1, 2, 4 and 6 supporting segments and a 100 N load, record the effort and the distance the effort moves for a 1 m lift.',
      'Show that MA × effort = load and VR × load distance = effort distance.',
      'Extension: set the efficiency to 80 %. How does the effort change? Is MA still equal to VR?',
    ],
  },
];

export const M06_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    'Examples follow the lecture notes and Tutorial 4. Torque through the train and efficiency are an extension.',
  view: 'Experiment',
  views: { train: 'Drive train', belt: 'Belt tensions', lift: 'Lifting pulleys' },
  presets: 'Examples',
  presetNames: {
    simple: '60T → 30T',
    idler: 'Idler (Tutorial 4 Q4)',
    compound: 'Compound train',
    beltTrain: 'Belt train A–F',
    chain: 'Bicycle chain',
  },
  stages: 'Number of stages',
  stage: 'Stage',
  kind: 'Drive',
  kinds: {
    gear: 'Gear pair',
    'belt-open': 'Open belt',
    'belt-crossed': 'Crossed belt',
    chain: 'Chain and sprockets',
  },
  driverTeeth: 'Driver teeth',
  drivenTeeth: 'Driven teeth',
  driverDiameter: 'Driver pulley diameter',
  drivenDiameter: 'Driven pulley diameter',
  idler: 'Idler teeth (0 = none)',
  efficiency: 'Stage efficiency (extension)',
  inputSpeed: 'Input speed',
  direction: 'Input direction',
  cw: 'Clockwise',
  ccw: 'Anticlockwise',
  inputTorque: 'Input torque (extension)',
  extensionTitle: 'Torque and efficiency (extension)',
  beltTight: 'Tight-side tension T1',
  beltSlack: 'Slack-side tension T2',
  beltDriverRadius: 'Driver pulley radius',
  beltDrivenRadius: 'Driven pulley radius',
  beltNote: 'The driver turns at the input speed above.',
  liftSupports: 'Supporting rope segments n',
  liftLoad: 'Load',
  liftHeight: 'Load rise',
  liftEfficiency: 'Efficiency (extension)',
  liveHint:
    'Every value can be changed while the train turns; the number of stages and drive types only after Reset.',
  diagram:
    'Drive train (wheels drawn to scale within each drive type, turning at the simulated speeds)',
  beltDiagram: 'Belt drive with tight and slack sides',
  liftDiagram: 'Block and tackle',
  wheel: 'Wheel',
  size: 'Size',
  speed: 'Speed (rpm)',
  dir: 'Direction',
  torque: 'Torque (N·m)',
  trainTable: 'Speed and direction of every wheel',
  measurements: {
    overallRatio: 'Overall ratio G',
    outputSpeed: 'Output speed',
    outputTorque: 'Output torque',
    inputPower: 'Input power',
    outputPower: 'Output power',
    beltTorqueDriver: 'Torque on driver pulley',
    beltTorqueDriven: 'Torque on driven pulley',
    beltSpeed: 'Belt speed',
    beltPower: 'Power transmitted',
    liftEffort: 'Effort',
    liftMA: 'Mechanical advantage',
    liftVR: 'Velocity ratio',
    liftEfficiency: 'Efficiency',
    liftEffortDistance: 'Effort distance',
  },
  idlerTag: ' (idler)',
  powerTitle: 'Power transmitted against driver speed',
  powerDesc: 'P = (T1 − T2)·ω·r for the present tensions and driver radius.',
  effortTitle: 'Effort against number of supporting segments',
  effortDesc: 'Effort = load/(n·η) for the present load and efficiency.',
  speedsTitle: 'Shaft speeds',
  speedsDesc: 'Speed of each shaft from input (shaft 0) to output; negative is anticlockwise.',
};
