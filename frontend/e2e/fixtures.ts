import { test as base, expect } from '@playwright/test';
import { installFakeApi } from './support/stub-api';

/** "Today" in every test is Monday, November 2, 2026, 2:00 PM UTC. */
export const TODAY = new Date('2026-11-02T14:00:00Z');

export const test = base.extend({
  page: async ({ page }, use) => {
    // Time starts at TODAY and flows; tests can jump ahead with page.clock.runFor().
    await page.clock.install({ time: TODAY });
    if (process.env['E2E_FAKE_API']) await installFakeApi(page);
    await use(page);
  },
});

export { expect };
