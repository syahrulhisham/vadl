// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/app';

describe('application shell (smoke test)', () => {
  it('renders the welcome page at "/" with the browser router', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Virtual Actuator and Drives Laboratory',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('designer-badge')).toHaveTextContent('Design by Syahrul Hisham™');
  });

  it('states that the model is a simplified educational simulation (NFR-12)', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/simplified educational model/i)).toBeInTheDocument();
  });
});
