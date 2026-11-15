import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end tests run against the production build (`vite preview`), so the
 * bundle that would be deployed is the bundle that is tested.
 *
 * Viewports follow NFR-03 in docs/srs.md: a laptop and a tablet in portrait, in
 * Chromium, run every test. The cross-browser projects (NFR-11: Edge, Firefox and
 * Safari's engine WebKit) run the integration pass through all ten laboratories.
 * One-time setup: `npx playwright install chromium firefox webkit` (Edge is the
 * installed Microsoft Edge).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Every laboratory animates its simulation; more parallel browsers than this starve
  // each other of CPU and time out on slower machines (seen in Milestones 7 and 8).
  workers: 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      name: 'edge',
      testMatch: /integration\.spec\.ts/,
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'firefox',
      testMatch: /integration\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'webkit',
      testMatch: /integration\.spec\.ts/,
      use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
