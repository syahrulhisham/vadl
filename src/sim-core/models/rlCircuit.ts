/**
 * First-order RL circuit: the engine's proving model (Milestone 3).
 * Documentation: docs/simulation-models/engine-rl-circuit.md.
 */
import { rlCurrentDerivative, rlTimeConstant } from '../equations/circuits';
import type { Issue, SimModel } from '../types';

export interface RlParams {
  /** Supply voltage V [V]. */
  readonly voltage: number;
  /** Total series resistance R [Ω]. */
  readonly resistance: number;
  /** Inductance L [H]. */
  readonly inductance: number;
}

export interface RlOutputs extends Readonly<Record<string, number>> {
  readonly current: number;
  readonly resistorVoltage: number;
  readonly inductorVoltage: number;
  readonly finalCurrent: number;
  readonly timeConstant: number;
  readonly fractionOfFinal: number;
}

/** Parameter limits, SI. Shared with the UI controls so both use the same ranges. */
export const RL_LIMITS = {
  voltage: { min: 0, max: 250 },
  resistance: { min: 0.1, max: 1000 },
  inductance: { min: 0.001, max: 10 },
} as const;

export const rlCircuitModel: SimModel<RlParams, RlOutputs> = {
  id: 'engine.rl-circuit',
  modelClass: 'dynamic',
  defaults: { voltage: 10, resistance: 10, inductance: 0.1 },
  stateLabels: ['i [A]'],
  assumptions: [
    'Ideal DC voltage source; the switch closes at t = 0 with zero initial current.',
    'Linear resistor and inductor with constant values; the coil resistance is included in R.',
    'No capacitance or other parasitic elements.',
    'Simplified educational model: no core saturation, switching arcs or temperature effects.',
  ],

  validate(p) {
    const issues: Issue[] = [];
    const { voltage, resistance, inductance } = RL_LIMITS;
    if (!Number.isFinite(p.voltage) || p.voltage < voltage.min || p.voltage > voltage.max) {
      issues.push({
        parameter: 'voltage',
        severity: 'error',
        message: `Supply voltage must be between ${voltage.min} and ${voltage.max} V.`,
      });
    }
    if (!Number.isFinite(p.resistance) || p.resistance <= 0) {
      issues.push({
        parameter: 'resistance',
        severity: 'error',
        message:
          'Resistance must be greater than zero: with R = 0 the current would rise without limit.',
      });
    } else if (p.resistance < resistance.min || p.resistance > resistance.max) {
      issues.push({
        parameter: 'resistance',
        severity: 'error',
        message: `Resistance must be between ${resistance.min} and ${resistance.max} Ω.`,
      });
    }
    if (!Number.isFinite(p.inductance) || p.inductance <= 0) {
      issues.push({
        parameter: 'inductance',
        severity: 'error',
        message:
          'Inductance must be greater than zero: with L = 0 the current would change instantly.',
      });
    } else if (p.inductance < inductance.min || p.inductance > inductance.max) {
      issues.push({
        parameter: 'inductance',
        severity: 'error',
        message: `Inductance must be between ${inductance.min} and ${inductance.max} H.`,
      });
    }
    return issues;
  },

  init() {
    return [0];
  },

  derivatives(_t, s, p) {
    return [rlCurrentDerivative(p.voltage, p.resistance, p.inductance, s[0] as number)];
  },

  outputs(_t, s, p) {
    const current = s[0] as number;
    const finalCurrent = p.voltage / p.resistance;
    const resistorVoltage = p.resistance * current;
    return {
      current,
      resistorVoltage,
      inductorVoltage: p.voltage - resistorVoltage,
      finalCurrent,
      timeConstant: rlTimeConstant(p.inductance, p.resistance),
      // With V = 0 there is no final current; report 0 % rather than divide by zero.
      fractionOfFinal: finalCurrent === 0 ? 0 : current / finalCurrent,
    };
  },

  fastestTimeConstant(p) {
    return rlTimeConstant(p.inductance, p.resistance);
  },
};
