/**
 * M03 Power Converters — English content (D5). Centred on course Lab 1
 * (single-phase AC-DC converters); notation from LN Ch1 Parts I–III.
 * Learning outcomes are provisional (D2).
 */
import type { ActivityContent, LabOutcome } from '../labContent';

export const M03_OUTCOMES: readonly LabOutcome[] = [
  {
    id: 'm03.lo1',
    courseLo: 'LO1',
    text: 'Explain how diode rectifiers and phase-controlled thyristor converters produce a DC output, and how the firing angle α controls it.',
  },
  {
    id: 'm03.lo2',
    courseLo: 'LO1',
    text: 'Calculate average and rms output, form factor, ripple factor and efficiency for resistive and highly inductive loads.',
  },
  {
    id: 'm03.lo3',
    courseLo: 'LO1',
    text: 'Analyse buck, boost and buck-boost converters: output voltage, inductor ripple and the minimum inductance for continuous conduction.',
  },
  {
    id: 'm03.lo4',
    courseLo: 'LO1',
    text: 'Describe how square-wave and PWM inverters produce AC, and compare their fundamental output and harmonic distortion.',
  },
  {
    id: 'm03.lo5',
    courseLo: 'LO2',
    text: 'Carry out Lab 1 in the virtual laboratory: record average and rms values at each supply voltage and firing angle, and compare with theory.',
  },
];

export const M03_THEORY = {
  intro:
    'A power converter uses switches — diodes, thyristors or transistors — to change the form of electrical power. Rectifiers turn AC into DC; choppers change one DC voltage into another; inverters turn DC into AC. The firing angle, duty cycle or modulation index sets the output.',
  rectifierTitle: 'Rectifiers and phase-controlled converters (Vm = √2·Vrms)',
  rectifier: [
    'Half-wave diode: Vavg = Vm/π,   Vrms = Vm/2',
    'Full-wave bridge: Vavg = 2Vm/π,   Vrms = Vm/√2',
    'Half-wave thyristor (R load): Vavg = (Vm/2π)(1 + cos α),   Vrms = (Vm/2)·√[(π − α + ½ sin 2α)/π]',
    'Full thyristor bridge, R load (Lab 1): Vavg = (Vm/π)(1 + cos α)',
    'Full converter, highly inductive load: Vavg = (2Vm/π)·cos α — negative above 90° (inversion)',
    'Semi-converter: Vavg = (Vm/π)(1 + cos α)',
    'Three-phase full bridge: Vavg = (3√3·Vm/π)·cos α = 1.35·VL·cos α (Vm = peak phase voltage)',
    'Form factor FF = Vrms/Vavg;  ripple factor RF = √(FF² − 1);  efficiency η = Pdc/Pac',
  ],
  dcdcTitle: 'DC-DC converters (continuous conduction)',
  dcdc: [
    'Buck: Vo = D·Vs;  ΔI = Vo(1 − D)/(L·f);  Lmin = (1 − D)R/(2f);  ΔVo = ΔI/(8fC)',
    'Boost: Vo = Vs/(1 − D);  IL = Vs/[(1 − D)²R];  ΔI = Vs·D/(L·f);  Lmin = D(1 − D)²R/(2f)',
    'Buck-boost: Vo = −Vs·D/(1 − D);  ΔI = Vs·D/(L·f);  Lmin = (1 − D)²R/(2f)',
  ],
  inverterTitle: 'Inverters',
  inverter: [
    'Square wave, single-phase full bridge: fundamental Vo1 = 4Vdc/(π√2) = 0.9·Vdc',
    'Sinusoidal PWM: compare a sine reference (amplitude ma) with a triangular carrier (mf times the output frequency). Fundamental peak = ma·Vdc (single-phase), linear for ma ≤ 1',
    'Three-phase six-step: line fundamental = (√6/π)·Vdc = 0.78·Vdc',
    'THD = √(Vrms² − V1²)/V1: PWM moves harmonics up to the carrier frequency, where a load inductance filters them easily',
  ],
  labTitle: 'Course Lab 1',
  lab: 'Lab 1 measures half-wave and full-wave rectifiers at 120, 220 and 240 V, then the half-wave thyristor converter and the full thyristor bridge at 240 V with α = 0° to 180° in 30° steps, all on a resistive load. Choose those circuits here to repeat the tables.',
};

export const M03_ACTIVITIES: readonly ActivityContent[] = [
  {
    id: 'm03.act.lab1-uncontrolled',
    level: 'beginner',
    guided: true,
    title: 'Lab 1 Part A/B: uncontrolled rectifiers',
    outcomeIds: ['m03.lo1', 'm03.lo5'],
    steps: [
      'Choose "Half-wave diode rectifier". Start the supply and watch the scope.',
      'Set the supply to 120, 220 and 240 V in turn and record a row each time (Lab 1 Table 1).',
      'Repeat with "Full-wave bridge rectifier" (Table 2).',
      'Check each average against Vm/π and 2Vm/π. Why is the full-wave average double?',
    ],
  },
  {
    id: 'm03.act.lab1-controlled',
    level: 'intermediate',
    guided: true,
    title: 'Lab 1 Part A/B: controlled converters, α = 0° to 180°',
    outcomeIds: ['m03.lo1', 'm03.lo2', 'm03.lo5'],
    steps: [
      'Choose "Half-wave thyristor converter", 240 V. Use the α buttons to set 0°, 30°, … 180° and record each (Table 3).',
      'Choose "Full thyristor bridge (R load)" and repeat (Table 4).',
      'Compare with (Vm/2π)(1 + cos α) and (Vm/π)(1 + cos α). Plot Vavg against α in the report.',
      'Explain why the output is zero at α = 180°.',
    ],
  },
  {
    id: 'm03.act.inductive',
    level: 'advanced',
    guided: true,
    title: 'Resistive or inductive load?',
    outcomeIds: ['m03.lo2'],
    steps: [
      'Choose "Full converter (highly inductive load)" at α = 60° and record. Compare with the R-load bridge at the same α.',
      'Increase α past 90°. What happens to Vavg, and why does a passive load then carry no current?',
      'Try the semi-converter and the three-phase bridge. Which can invert?',
    ],
  },
  {
    id: 'm03.act.dcdc',
    level: 'intermediate',
    guided: true,
    title: 'Buck, boost and buck-boost',
    outcomeIds: ['m03.lo3'],
    steps: [
      'Choose the buck converter (48 V, D 0.4, L 1 mH, 20 kHz, R 10 Ω). Check Vo = 19.2 V and ΔI = 0.576 A.',
      'Vary D from 0.2 to 0.8 and record. Plot Vo against D.',
      'Switch to boost and buck-boost. Compare the Vo–D curves.',
      'Reduce L until the warning appears. Compare the warning value with Lmin = (1 − D)R/(2f).',
    ],
  },
  {
    id: 'm03.act.inverter',
    level: 'advanced',
    guided: false,
    title: 'Inverter output quality (independent)',
    outcomeIds: ['m03.lo4'],
    steps: [
      'Compare the square-wave and sinusoidal PWM inverters: record Vrms, the fundamental and THD for each.',
      'Investigate how ma and mf change the fundamental and the waveform. Explain your findings.',
    ],
  },
];

export const M03_LABELS = {
  family: 'Converter type',
  families: {
    rectifier: 'AC–DC (rectifiers, Lab 1)',
    dcdc: 'DC–DC (choppers)',
    inverter: 'DC–AC (inverters)',
  },
  circuit: 'Circuit',
  rectifiers: {
    'diode-half': 'Half-wave diode rectifier',
    'diode-bridge': 'Full-wave bridge rectifier',
    'thyristor-half': 'Half-wave thyristor converter (R load)',
    'thyristor-bridge-r': 'Full thyristor bridge (R load)',
    'thyristor-bridge-l': 'Full converter (highly inductive load)',
    'semi-bridge-l': 'Semi-converter (highly inductive load)',
    'three-phase-bridge-l': 'Three-phase full bridge (inductive load)',
  },
  dcdcs: {
    buck: 'Buck (step-down)',
    boost: 'Boost (step-up)',
    'buck-boost': 'Buck-boost (inverting)',
  },
  inverters: {
    'single-square': 'Single-phase, square wave',
    'single-bipolar': 'Single-phase, bipolar PWM',
    'single-unipolar': 'Single-phase, unipolar PWM',
    'three-six-step': 'Three-phase, six-step',
    'three-spwm': 'Three-phase, sinusoidal PWM',
  },
  supplyRms: 'Supply voltage (rms; line for 3-φ)',
  lab1Supply: 'Lab 1 supply',
  supplyFrequency: 'Supply frequency',
  alpha: 'Firing angle α',
  lab1Alpha: 'Lab 1 firing angles',
  loadResistance: 'Load resistance R',
  dcInput: 'Input voltage Vs',
  duty: 'Duty cycle D',
  inductance: 'Inductance L',
  capacitance: 'Capacitance C',
  dcLoadResistance: 'Load resistance R',
  switchingFrequency: 'Switching frequency f',
  dcLink: 'DC-link voltage Vdc',
  modulationIndex: 'Modulation index ma',
  frequencyRatio: 'Frequency ratio mf',
  outputFrequency: 'Output frequency',
  inverterLoadResistance: 'Load resistance R',
  loadNote:
    'The Lab 1 sheet does not state the load resistance; 100 Ω is used until it is confirmed (lecturer question L-5).',
  liveHint: 'All settings can be changed while the converter runs.',
  scope: 'Oscilloscope',
  scopeDesc: 'Output voltage over the last two periods, live.',
  playback: {
    half: '0.5 period per second',
    one: '1 period per second',
    five: '5 periods per second',
  },
  measurements: {
    vAverage: 'Average output voltage',
    vRms: 'RMS output voltage',
    iAverage: 'Average output current',
    iRms: 'RMS output current',
    formFactor: 'Form factor',
    rippleFactor: 'Ripple factor',
    rectificationEfficiency: 'Rectification efficiency',
    inputPowerFactor: 'Input power factor',
    outputPower: 'Output power',
    inductorAverage: 'Average inductor current',
    inductorRipple: 'Inductor ripple ΔI',
    inductorMax: 'Inductor current maximum',
    inductorMin: 'Inductor current minimum',
    inductorMinimum: 'Minimum L for continuous conduction',
    outputRipple: 'Output voltage ripple',
    vFundamental: 'Fundamental (rms)',
    vFundamentalClosedForm: 'Fundamental, formula',
    thd: 'THD',
  },
  continuousYes: 'Continuous conduction: the formulas apply.',
  continuousNo:
    'Discontinuous conduction: the continuous-conduction formulas and waveforms do not apply.',
  periodVoltage: 'Voltages over one period',
  periodVoltageDesc:
    'Supply and output voltage (or switch and inductor signals) over one period, from the model.',
  periodCurrent: 'Currents over one period',
  periodCurrentDesc: 'Load, supply or inductor current over one period, from the model.',
  periodGate: 'Switching signals over one period',
  periodGateDesc: 'Gate signal (1 = on), and for PWM the carrier and reference.',
  characteristic: 'Control characteristic with the operating point',
  characteristicDesc:
    'Average (or fundamental) output against the control variable, with the present setting marked.',
  dataNote:
    'Circuits are ideal (no losses). Values follow the course formulas; see the assumptions.',
  openReport: 'Open laboratory report',
};
