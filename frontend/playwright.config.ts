import { defineConfig, devices } from '@playwright/test';

// PW_BASE_URL points the suite at servers that are already running.
const external = process.env['PW_BASE_URL'];
// E2E_FAKE_API=1 answers /api in the browser (e2e/support/stub-api.ts) so the suite runs without the .NET API.
const fake = !!process.env['E2E_FAKE_API'];

/**
 * Playwright runs in Chromium only (AGENTS.md) against `ng serve` proxying to the API, which the global
 * setup starts on a freshly seeded SQLite database with the clock fixed at Monday, November 2, 2026.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  snapshotPathTemplate: './e2e/visual-baselines/{testFileName}/{arg}-{platform}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: external || fake ? undefined : './e2e/support/global-setup.ts',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: external ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
  },
  projects: [
    // The app, end to end, against the API.
    {
      name: 'chromium',
      testDir: './e2e/tests',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: [
    ...(external
      ? []
      : [
          {
            command: 'npx ng serve ingresso --port 4200',
            url: 'http://localhost:4200',
            reuseExistingServer: !process.env['CI'],
            timeout: 180_000,
          },
        ]),
  ],
});
