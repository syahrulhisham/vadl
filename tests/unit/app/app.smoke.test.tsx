// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app';

describe('application shell (smoke test)', () => {
  it('renders the application name as the main heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Virtual Actuator and Drives Laboratory' }),
    ).toBeInTheDocument();
  });

  it('shows the designer badge in the header (decision D6)', () => {
    render(<App />);
    expect(screen.getByTestId('designer-badge')).toHaveTextContent('Design by Syahrul Hisham™');
  });

  it('lists all ten laboratory modules from the registry', () => {
    render(<App />);
    const list = screen.getByRole('list', { name: 'Laboratory modules' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(within(list).getByRole('heading', { name: 'DC Motor Drives' })).toBeInTheDocument();
    expect(within(list).getByRole('heading', { name: 'Electrohydraulics' })).toBeInTheDocument();
  });

  it('states that the model is a simplified educational simulation (NFR-12)', () => {
    render(<App />);
    expect(screen.getByText(/simplified educational model/i)).toBeInTheDocument();
  });
});
