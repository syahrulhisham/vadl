// Adds DOM matchers (toBeInTheDocument, toHaveTextContent, ...) to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';
import { afterEach } from 'vitest';

// Pages are lazily loaded chunks. Under the parallel coverage run a cold import
// can take over the 1 s default, so `findBy…` queries wait up to 5 s.
configure({ asyncUtilTimeout: 5_000 });

// Vitest globals are off, so Testing Library cannot register its own cleanup.
// Unmount rendered trees after each test so tests stay independent.
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
