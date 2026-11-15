/**
 * M10 Electrohydraulics — English content (D5). Covers course Lab 4a (hydraulics,
 * hand-lever valves; Festo TP501) and Lab 4b (electrohydraulics; Festo TP601).
 * Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M10_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm10.lo1',
    courseLo: 'LO1',
    text: 'Explain the hydraulic power unit (pump, reservoir, relief valve), directional control valves, non-return and flow control valves, and cylinders.',
  },
  {
    id: 'm10.lo2',
    courseLo: 'LO1',
    text: 'Calculate load pressure, piston speeds, stroke times, area, speed and time ratios, forces with back pressure, and hydraulic and drive power.',
  },
  {
    id: 'm10.lo3',
    courseLo: 'LO2',
    text: 'Operate the Lab 4a and Lab 4b circuits, measure traversing pressure and travel time, and compare them with calculation.',
  },
  {
    id: 'm10.lo4',
    courseLo: 'LO2',
    text: 'Design and test electrohydraulic control with OR, AND and latching relay circuits.',
  },
];

export const M10_THEORY = {
  intro:
    'A hydraulic power unit pumps oil from the reservoir; the pressure rises only as far as the load demands, up to the setting of the pressure-relief valve, which then returns the surplus oil to the tank. Valves direct the oil to the cylinder; the flow sets the speed and the pressure sets the force.',
  equationsTitle: 'Equations (course and Festo notation)',
  equations: [
    'Pressure p = F/A; load pressure from a weight on the annulus p_L = F_G/A_PR (9 kg → 90 N, 1.2 cm² → 0.75 MPa)',
    'Piston speed v = q/A; stroke time t = s/v',
    'Area ratio φ = A_P/A_PR; speed ratio v_out/v_in = 1/φ; time ratio = φ',
    'Force with back pressure F = A_P·p1 − A_PR·p2',
    'Pump flow q = V·n (·η_v); hydraulic power P = p·q; drive power P = p·q/η with η = 0.7',
    'Lab cylinder 16/10/200 mm (A_P ≈ 2.0 cm², A_PR ≈ 1.2 cm²); pump about 2.2 L/min (calculations use 2 L/min); relief valve set to 5 MPa (system limit 6 MPa)',
  ],
  componentsTitle: 'Components',
  components: [
    'Pressure-relief valve: closed until the pressure approaches its setting; it starts to open about 0.4 MPa below the setting and passes the whole pump flow at the setting. It protects the system and limits the force.',
    'Non-return (check) valve: flow in one direction only; opens at about 0.6 MPa. It holds a suspended load when the pump stops.',
    'One-way flow control: throttles in one direction, free flow back. Meter-in throttles the oil going in; meter-out the oil coming out (needed when the load would run away, e.g. lowering a weight). A simple throttle is load-dependent; a 2-way flow control valve is not.',
    '4/2 and 3/2 directional valves, worked by hand lever or solenoid; a 4/2 valve can be used as a 3/2 or 2/2 by plugging ports.',
    'Pressure gauges at the pump (P) and at the cylinder ports read the traversing pressure (during motion) and the back pressure.',
  ],
  electricalTitle: 'Electrohydraulic control (Lab 4b)',
  electrical: [
    'Push buttons switch relays, relays switch the solenoids (indirect control): push-button contacts are rated about 2 A, relay contacts about 5 A; a 12 W solenoid draws 0.5 A at 24 V.',
    'OR: buttons in parallel. AND: buttons in series. Latch: a relay contact holds the relay on until a reset button opens the circuit.',
    'Solenoid valves with spring return go to their rest position when the control power fails.',
  ],
  modelTitle: 'How VADL calculates pressures and speeds',
  model:
    'Pressures and speeds come from a quasi-static flow model: the oil passes the valves and flow controls as through orifices (q = A·√(2Δp/ρ)); the valve passage is calibrated to the 0.05 MPa the course measured at 2 L/min. The pump flow is shared between the cylinder and the relief valve so that both the flow and the force balance hold.',
};

export const M10_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm10.act.ex1',
    level: 'beginner',
    guided: true,
    title: 'Lab 4a Exercise 1: unloading a paper machine',
    outcomeIds: ['m10.lo1', 'm10.lo3'],
    steps: [
      'Choose 4a Ex 1. Start, switch the pump on: the load rises. What is the role of the non-return valve 1V1?',
      'Switch the pump off and open the 2/2 valve: the load lowers by its own weight. Change the flow control and record the lowering time.',
      'Open the valve with the pump running. Why is the lowering slower?',
    ],
  },
  {
    id: 'm10.act.ex2',
    level: 'intermediate',
    guided: true,
    title: 'Lab 4a Exercise 2: opening a hardening furnace',
    outcomeIds: ['m10.lo2', 'm10.lo3'],
    steps: [
      'Choose 4a Ex 2. Raise the door (lever and pump on) and read the traversing pressure and travel time. Record a row.',
      'Calculate the load pressure for 90 N on A_PR = 1.2 cm² and the retract speed and time for 2 L/min. Compare with the readings: what is the difference due to?',
      'Lower the door with the lever released; change the flow control and record the travel times.',
    ],
  },
  {
    id: 'm10.act.ex3',
    level: 'intermediate',
    guided: true,
    title: 'Lab 4a Exercise 3: boiler door (area, speed and time ratios)',
    outcomeIds: ['m10.lo2', 'm10.lo3'],
    steps: [
      'Choose 4a Ex 3. Extend and retract; record the travel times and pressures.',
      'Calculate φ, the advance and return speeds and times, and the speed and time ratios. Compare.',
      'At the end of the stroke, read the pump pressure and the relief flow. Where does the pump flow go?',
    ],
  },
  {
    id: 'm10.act.4b1',
    level: 'intermediate',
    guided: false,
    title: 'Lab 4b Exercise 1: sorting crates (meter-in)',
    outcomeIds: ['m10.lo1', 'm10.lo4'],
    steps: [
      'Choose 4b Ex 1. Hold S1 to extend; release to retract. Read the coil current.',
      'Change the flow control: which stroke changes speed, and why only that one?',
      'Simulate a control-power failure: what does the cylinder do?',
    ],
  },
  {
    id: 'm10.act.4b2',
    level: 'advanced',
    guided: false,
    title: 'Lab 4b Exercise 2: lifting platform (OR, AND, latch)',
    outcomeIds: ['m10.lo4'],
    steps: [
      'Choose 4b Ex 2A, 2B and 2C in turn. Raise the platform with S1 and S2 and lower it with S3. Describe each control.',
      'For 2C, explain how the latch is reset. Which is safer for a lifting platform, hold-to-run or latching?',
    ],
  },
  {
    id: 'm10.act.power',
    level: 'advanced',
    guided: false,
    title: 'Relief valve and power',
    outcomeIds: ['m10.lo2'],
    steps: [
      'With the cylinder at the end of its stroke, change the relief setting and read the pump pressure, the hydraulic power and the drive power (η = 0.7).',
      'Raise the load until it can no longer be lifted. Compare with the force at the relief setting, F = p·A_PR.',
    ],
  },
];

export const M10_LABELS = {
  openReport: 'Open laboratory report',
  dataNote:
    "Festo TP501/TP601 equipment: cylinder 16/10/200 mm, 9 kg weight, relief 5 MPa, non-return 0.6 MPa. Pressures and speeds come from VADL's flow model.",
  circuit: 'Lab circuit',
  circuits: {
    '4a-ex1': '4a Ex 1: unloading a paper machine (2/2 lever)',
    '4a-ex2': '4a Ex 2: hardening furnace (3/2 lever)',
    '4a-ex3': '4a Ex 3: boiler door (4/2 lever)',
    '4b-ex1': '4b Ex 1: sorting crates (4/2 solenoid, meter-in)',
    '4b-ex2a': '4b Ex 2A: lifting platform, OR',
    '4b-ex2b': '4b Ex 2B: lifting platform, AND',
    '4b-ex2c': '4b Ex 2C: lifting platform, latch',
  },
  operate: 'Operate',
  pump: 'Pump',
  pumpOn: 'on',
  pumpOff: 'circulating (0V1 open)',
  lever: 'Hand lever',
  leverOn: 'actuated',
  leverOff: 'released',
  s3: 'S3 lower',
  pumpFlow: 'Pump flow',
  relief: 'Relief valve setting',
  throttle: 'Flow control opening (one-way)',
  loadForce: 'Load (weight or opposing force)',
  cylinderTitle: 'Cylinder',
  bore: 'Bore D',
  rod: 'Rod d',
  stroke: 'Stroke',
  liveHint:
    'Valves, buttons, pump and settings can be changed while running; the circuit and cylinder only after Reset.',
  diagram: 'Circuit (components light up when oil flows through them)',
  vertical: 'vertical, rod down, weight on the rod',
  horizontal: 'horizontal',
  modes: [
    'extending',
    'retracting (raising)',
    'lowering by the weight',
    'lowering, pump flow joining',
    'holding',
  ],
  cavitation:
    'The load runs ahead of the pump: the filling chamber is at about zero pressure (cavitation risk). Use meter-out throttling.',
  coils: 'Relays and solenoids',
  chain: {
    solenoidValve: '1V solenoid valve',
    leverValve: '1V hand-lever valve',
    check: 'non-return 0.6 MPa',
    pump: 'Pump 0P1',
    relief: 'Relief 0V2',
    fcv: 'Flow control',
  },
  measurements: {
    position: 'Piston position (extension)',
    velocity: 'Piston speed',
    pumpPressure: 'Pump pressure (gauge 0Z)',
    capPressure: 'Cap-side pressure (A)',
    rodPressure: 'Rod-side pressure (B)',
    loadPressure: 'Load pressure F/A_PR',
    cylinderFlow: 'Flow to cylinder',
    reliefFlow: 'Flow over relief valve',
    hydraulicPower: 'Hydraulic power p·q',
    drivePower: 'Drive power p·q/0.7',
    areaRatio: 'Area ratio φ',
    coilCurrent: 'Coil current',
  },
  positionTitle: 'Piston position against time',
  positionDesc: 'Extension of the rod (0 = fully retracted).',
  pressureTitle: 'Pressures against time',
  pressureDesc: 'Pump pressure and the two cylinder ports.',
};
