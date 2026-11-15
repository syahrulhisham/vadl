// Adds DOM matchers (toBeInTheDocument, toHaveTextContent, ...) to Vitest's expect.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/dom';
import { afterEach } from 'vitest';

// Pages are lazily loaded chunks. Under the parallel coverage run a cold import
// of a laboratory (five of them since Milestone 6) can take several seconds, so
// `findBy…` queries wait up to 15 s (still well inside the 30 s test timeout).
configure({ asyncUtilTimeout: 15_000 });

// Vitest globals are off, so Testing Library cannot register its own cleanup.
// Unmount rendered trees after each test so tests stay independent.
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
