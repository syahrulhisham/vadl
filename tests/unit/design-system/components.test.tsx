// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  buttonClasses,
  Icon,
  LinkButton,
  MeasurementDisplay,
  NumberControl,
  Panel,
  StatusBadge,
} from '@/design-system';

describe('Button and LinkButton (NFR-03)', () => {
  it('every variant carries the 44 px minimum touch target', () => {
    for (const v of ['primary', 'secondary', 'ghost'] as const) {
      expect(buttonClasses(v)).toContain('min-h-touch');
      expect(buttonClasses(v)).toContain('min-w-touch');
    }
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Start</Button>);
    expect(screen.getByRole('button', { name: 'Start' })).toHaveAttribute('type', 'button');
  });

  it('LinkButton is a real link', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/modules">Open</LinkButton>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/modules');
  });
});

describe('MeasurementDisplay (FR-06, NFR-04)', () => {
  it('shows a dash, not a number, before any value exists', () => {
    render(<MeasurementDisplay label="Armature current" symbol="Ia" value={null} unit="A" />);
    const value = screen.getByTestId('measurement-value');
    expect(value).toHaveTextContent('—');
    expect(value).toHaveAccessibleName('no value yet');
  });

  it('formats to the requested significant figures with the unit', () => {
    render(
      <MeasurementDisplay label="Speed" value={1671.1269} unit="rpm" significantFigures={5} />,
    );
    const value = screen.getByTestId('measurement-value');
    expect(value).toHaveTextContent('1671.1');
    expect(value).toHaveAccessibleName('1671.1 rpm');
    expect(screen.getByRole('group', { name: 'Speed' })).toHaveTextContent('rpm');
  });

  it('renders the value at text-2xl (24 px), above the 20 px projector minimum', () => {
    render(<MeasurementDisplay label="Torque" value={24} unit="N·m" />);
    expect(screen.getByTestId('measurement-value').className).toContain('text-2xl');
  });

  it('shows a dash for a non-finite value instead of a misleading number', () => {
    render(<MeasurementDisplay label="Efficiency" value={Number.NaN} unit="%" />);
    expect(screen.getByTestId('measurement-value')).toHaveTextContent('—');
  });
});

describe('NumberControl (FR-05)', () => {
  function Harness({ onChange }: { onChange: (v: number) => void }) {
    const [v, setV] = useState(220);
    return (
      <NumberControl
        label="Armature voltage"
        value={v}
        min={0}
        max={250}
        step={1}
        unit="V"
        onChange={(n) => {
          setV(n);
          onChange(n);
        }}
        explainOutOfRange={(n) => `${n} V exceeds the 250 V rating.`}
      />
    );
  }

  it('passes valid typed values to the model', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Armature voltage \(V\)/), { target: { value: '180' } });
    expect(onChange).toHaveBeenLastCalledWith(180);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects out-of-range input with an explanation and never passes it on', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const box = screen.getByLabelText(/Armature voltage \(V\)/);
    fireEvent.change(box, { target: { value: '300' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('300 V exceeds the 250 V rating.');
    expect(box).toHaveAttribute('aria-invalid', 'true');
  });

  it('restores the accepted value when the box loses focus', () => {
    render(<Harness onChange={vi.fn()} />);
    const box = screen.getByLabelText(/Armature voltage \(V\)/);
    fireEvent.change(box, { target: { value: '999' } });
    fireEvent.blur(box);
    expect(box).toHaveValue(220);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('the slider changes the value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider', { name: 'Armature voltage slider' }), {
      target: { value: '100' },
    });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });
});

describe('Icon, Panel and StatusBadge (NFR-10)', () => {
  it('decorative icons are hidden from assistive technology; labelled icons are images', () => {
    const { container } = render(
      <>
        <Icon name="home" />
        <Icon name="menu" label="Menu" />
      </>,
    );
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Menu' })).toBeInTheDocument();
  });

  it('Panel is a region named by its heading', () => {
    render(<Panel title="Theory">content</Panel>);
    expect(screen.getByRole('region', { name: 'Theory' })).toHaveTextContent('content');
    expect(screen.getByRole('heading', { level: 2, name: 'Theory' })).toBeInTheDocument();
  });

  it('StatusBadge carries its meaning in text', () => {
    render(<StatusBadge tone="warning">Planned</StatusBadge>);
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });
});
