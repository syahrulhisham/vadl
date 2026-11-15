import type { StepperOutputs } from '@/sim-core';

/** Phase currents from the model's outputs, one per phase (display only). */
export function phaseCurrentsOf(o: StepperOutputs, phases: number): number[] {
  return [o.i0, o.i1, o.i2, o.i3, o.i4].slice(0, phases);
}

export const PHASE_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
