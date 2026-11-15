/**
 * Pneumatic signal logic of the course Lab 2 circuits (Festo TP101 Ex 5, 9,
 * 10, 12 and the direct-control circuit). Valves are ideal: a signal is either
 * pressurised or exhausted; the shuttle valve is OR, the dual-pressure valve AND;
 * a single-pilot 5/2 valve returns by spring; a double-pilot 5/2 valve keeps its
 * last position (memory) and ignores a pilot signal while the opposite one is present.
 */

export type PneumaticCircuitId = 'direct' | 'indirect' | 'or' | 'and-memory' | 'and-or';

export const PNEUMATIC_CIRCUITS: readonly PneumaticCircuitId[] = [
  'direct',
  'indirect',
  'or',
  'and-memory',
  'and-or',
];

export interface PneumaticInputs {
  /** Push buttons 1S1, 1S2 (pressed = true) and the detented selector switch. */
  readonly s1: boolean;
  readonly s2: boolean;
  readonly selector: boolean;
}

export interface PneumaticSignals {
  /** Named signal lines and their state, for display (e.g. "1S1", "1V1 OR"). */
  readonly lines: Readonly<Record<string, boolean>>;
  /** Pilot signals of a double-pilot valve (set = 14, reset = 12), if the circuit has one. */
  readonly set: boolean;
  readonly reset: boolean;
  /** For circuits without memory: true when the cylinder supply port is pressurised. */
  readonly drive: boolean;
}

/** Whether the circuit uses a single-acting cylinder (spring return). */
export function isSingleActing(id: PneumaticCircuitId): boolean {
  return id === 'direct' || id === 'or';
}

/** Whether the final control element is a double-pilot (memory) 5/2 valve. */
export function hasMemoryValve(id: PneumaticCircuitId): boolean {
  return id === 'and-memory' || id === 'and-or';
}

/**
 * Signal states for the given inputs and end-position sensors (1B1 retracted,
 * 1B2 extended: roller-lever valves or pneumatic proximity switches).
 */
export function pneumaticSignals(
  id: PneumaticCircuitId,
  inputs: PneumaticInputs,
  atRetracted: boolean,
  atExtended: boolean,
): PneumaticSignals {
  switch (id) {
    case 'direct':
      return { lines: { '1S1': inputs.s1 }, set: false, reset: false, drive: inputs.s1 };
    case 'indirect':
      return {
        lines: { '1S1 selector': inputs.selector, '1V1 pilot 14': inputs.selector },
        set: false,
        reset: false,
        drive: inputs.selector,
      };
    case 'or': {
      const or = inputs.s1 || inputs.s2;
      return {
        lines: { '1S1': inputs.s1, '1S2': inputs.s2, '1V1 shuttle (OR)': or },
        set: false,
        reset: false,
        drive: or,
      };
    }
    case 'and-memory': {
      const and = inputs.s1 && atRetracted;
      return {
        lines: {
          '1S1': inputs.s1,
          '1B1 roller (retracted)': atRetracted,
          '1V1 dual-pressure (AND)': and,
          '1S2': inputs.s2,
        },
        set: and,
        reset: inputs.s2,
        drive: false,
      };
    }
    case 'and-or': {
      const or = inputs.s1 || inputs.s2;
      const set = atRetracted && or;
      const reset = atExtended && or;
      return {
        lines: {
          '1S1': inputs.s1,
          '1S2': inputs.s2,
          '1V1 shuttle (OR)': or,
          '1B1 begin': atRetracted,
          '1V2 AND (begin)': set,
          '1B2 end': atExtended,
          '1V3 AND (end)': reset,
        },
        set,
        reset,
        drive: false,
      };
    }
  }
}

/** New state of a double-pilot (memory) valve: set wins only alone, reset only alone. */
export function memoryValve(previous: boolean, set: boolean, reset: boolean): boolean {
  if (set && !reset) return true;
  if (reset && !set) return false;
  return previous;
}
