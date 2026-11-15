import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

/**
 * Deployment check (Milestone 10): builds VADL for a sub-folder, /vadl/, into
 * dist-base/ and tests it there. Run with `npm run test:e2e:base`.
 */
export default defineConfig({
  testDir: 'tests/e2e-base',
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1366, height: 768 },
  },
  webServer: {
    command: `npx vite build --outDir dist-base && npx vite preview --outDir dist-base --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/vadl/`,
    env: { VADL_BASE: '/vadl/' },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
