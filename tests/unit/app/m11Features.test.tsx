// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app';
import { createLocalStorageRepository, createMemoryStorage, RepositoryProvider } from '@/storage';

/** Milestone 11: views, explorers and sensor options brought in from the earlier labs. */

function open(path: string) {
  render(
    <RepositoryProvider repository={createLocalStorageRepository(createMemoryStorage())}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </RepositoryProvider>,
  );
}

const value = (name: string) =>
  within(screen.getByRole('group', { name, exact: true } as never)).getByTestId('measurement-value')
    .textContent;
const regions = () => within(screen.getByTestId('lab-shell')).getAllByRole('region');
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
/** The number field of a NumberControl: its label carries the unit, e.g. "Speed (rpm)". */
const numberField = (label: string, unit: string) => screen.getByLabelText(`${label} (${unit})`);
const setNumber = (label: string, unit: string, v: string) => {
  const input = numberField(label, unit);
  fireEvent.change(input, { target: { value: v } });
  fireEvent.blur(input);
};

describe('M01 operating-principle sequence and construction explorer', () => {
  it('steps through the eight stages and keeps the seven regions', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Operating principle');
    const drawing = screen.getByTestId('principle-drawing');
    expect(drawing).toHaveAttribute('data-stage', 'field-current');
    expect(screen.getByTestId('principle-step')).toHaveTextContent('Step 1 of 8');
    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
    press('Next step');
    expect(drawing).toHaveAttribute('data-stage', 'flux');
    expect(screen.getByTestId('principle-text')).toHaveTextContent(/does not rotate/);
    expect(screen.getByTestId('principle-rotor')).toHaveAttribute('data-rotating', 'false');
    press('6. Rotation');
    expect(screen.getByTestId('principle-rotor')).toHaveAttribute('data-rotating', 'true');
    press('8. Back-emf');
    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled();
    expect(regions()).toHaveLength(7);
  });

  it('shows model values, labelled, and states that the drawing is not a measurement', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Operating principle');
    // At rest the separately excited preset has If = 1 A and no armature current or speed.
    expect(screen.getByTestId('principle-live')).toHaveTextContent(
      'From the model now: If = 1 A · Ia = 0 A · Td = 0 N·m · N = 0 rpm · Eg = 0 V',
    );
    expect(screen.getByText(/The drawing is not a measurement/)).toBeInTheDocument();
  });

  it('highlights a chosen part and describes it; choosing it again clears it', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Operating principle');
    expect(screen.getByTestId('part-description')).toHaveTextContent('');
    press('Commutator');
    expect(screen.getByRole('button', { name: 'Commutator' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByTestId('part-description')).toHaveTextContent(/reverses the current/);
    press('Commutator');
    expect(screen.getByTestId('part-description')).toHaveTextContent('');
  });
});

describe('M01 drive waveforms', () => {
  it('full converter at rest: Eg 0 from the model, averages from the waveform', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Drive waveforms');
    expect(screen.getByTestId('drive-scope')).toBeInTheDocument();
    expect(value('Back-emf used')).toBe('0');
    // Default supply 240 V rms: (2Vm/π)·cos 30° = 187.1 V (RC-M01-06).
    expect(value('Average armature voltage')).toBe('187.1');
    expect(screen.getByTestId('scope-mode')).toHaveTextContent(/Continuous conduction/);
    expect(screen.getByTestId('scope-cursor-path')).toHaveTextContent('T1 + T2');
    expect(screen.getByTestId('conduction-strip')).toBeInTheDocument();
    expect(regions()).toHaveLength(7);
  });

  it('inversion with a back-emf set by hand shows regeneration in quadrant IV (RC-M01-10)', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Drive waveforms');
    fireEvent.change(screen.getByRole('combobox', { name: 'Back-emf Eg' }), {
      target: { value: 'manual' },
    });
    setNumber('Back-emf Eg (negative: the load drives the motor in reverse)', 'V', '-220');
    setNumber('Firing angle α (α1 for a dual converter)', '°', '150');
    expect(value('Back-emf used')).toBe('-220');
    expect(value('Average armature voltage')).toBe('-187.1');
    expect(screen.getByTestId('scope-quadrant')).toHaveTextContent(/Quadrant IV/);
    expect(screen.getByTestId('scope-regen')).toBeInTheDocument();
  });

  it('dual converter, circulating current: the reactor control and peak current appear', async () => {
    open('/modules/dc-motor-drives');
    await screen.findByTestId('lab-shell');
    press('Drive waveforms');
    expect(screen.queryByRole('group', { name: 'Peak circulating current' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Armature converter' }), {
      target: { value: 'dual-circulating' },
    });
    setNumber('Firing angle α (α1 for a dual converter)', '°', '60');
    // (2Vm/ωLr)(1 − cos 60°) with Vm = 339.4 V, 50 Hz, Lr = 0.05 H = 21.6 A (RC-M01-11).
    expect(value('Peak circulating current')).toMatch(/^21\.6/);
    expect(screen.getByTestId('scope-cursor-path')).toHaveTextContent('Both converters');
  });
});

describe('M04 hybrid stepper formula and construction explorer', () => {
  it('hybrid: 50 rotor teeth give 1.8°; 100 teeth give 0.9° (RC-M04-06)', async () => {
    open('/modules/stepper-motors');
    await screen.findByTestId('stepper-diagram');
    expect(screen.queryByTestId('hybrid-note')).toBeNull();
    press('Hybrid 1.8°');
    expect(screen.getByTestId('hybrid-note')).toHaveTextContent('Sa = 360°/(4·Nr)');
    expect(numberField('Hybrid rotor teeth Nr', '—')).toHaveValue(50);
    expect(value('Full step angle')).toBe('1.8');
    setNumber('Hybrid rotor teeth Nr', '—', '100');
    expect(value('Full step angle')).toBe('0.9');
    expect(value('Pulses per revolution')).toBe('400');
  });

  it('the explorer highlights the chosen part in the diagram', async () => {
    open('/modules/stepper-motors');
    const diagram = await screen.findByTestId('stepper-diagram');
    expect(diagram).toHaveAttribute('data-highlight', '');
    press('Rotor');
    expect(diagram).toHaveAttribute('data-highlight', 'rotor');
    expect(screen.getByTestId('part-description')).toHaveTextContent(/toothed soft iron/);
    expect(regions()).toHaveLength(7);
  });
});

describe('M05 sensors, decoder chain and AC servo', () => {
  it('decoding changes the encoder resolution: X4 0.18°, X1 0.72° (RC-M05-06)', async () => {
    open('/modules/servo-motors');
    await screen.findByTestId('servo-diagram');
    expect(value('Encoder resolution')).toBe('0.18');
    fireEvent.change(screen.getByRole('combobox', { name: 'Encoder decoding' }), {
      target: { value: '1' },
    });
    expect(value('Encoder resolution')).toBe('0.72');
    expect(within(screen.getByTestId('chain-encoder')).getByText(/X1/)).toBeInTheDocument();
  });

  it('resolver converter: 12 bits give 0.08789° per count; the chain outlines the loop sensor', async () => {
    open('/modules/servo-motors');
    await screen.findByTestId('servo-diagram');
    expect(value('Resolver resolution')).toBe('0.08789');
    expect(screen.getByTestId('chain-resolver')).toHaveAttribute('data-active', 'false');
    fireEvent.change(screen.getByRole('combobox', { name: 'Position sensor' }), {
      target: { value: 'resolver' },
    });
    expect(screen.getByTestId('chain-resolver')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('chain-encoder')).toHaveAttribute('data-active', 'false');
    expect(within(screen.getByTestId('servo-diagram')).getByText('Resolver')).toBeInTheDocument();
  });

  it('AC servo: control phase shown, no armature current, loop still has seven regions', async () => {
    open('/modules/servo-motors');
    await screen.findByTestId('servo-diagram');
    expect(screen.queryByRole('group', { name: 'Control phase' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Servo motor' }), {
      target: { value: 'ac' },
    });
    expect(value('Control phase')).toBe('0');
    expect(value('Armature current')).toBe('—');
    expect(screen.getByText(/There is no armature current/)).toBeInTheDocument();
    expect(regions()).toHaveLength(7);
  });

  it('the loop explorer highlights the chosen block', async () => {
    open('/modules/servo-motors');
    const diagram = await screen.findByTestId('servo-diagram');
    press('Servo amplifier');
    expect(diagram).toHaveAttribute('data-highlight', 'amplifier');
    expect(screen.getByTestId('part-description')).toHaveTextContent(/Va = Kp·Ve/);
  });
});
