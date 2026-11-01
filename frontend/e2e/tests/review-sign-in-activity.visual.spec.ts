// Acceptance Test
// Traces to: L2-142, L2-144, L2-145
// Description: The Activity page and the Settings Activity card look as designed in docs/mocks (activity: default, filtered, empty, loading, error; settings: default).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { ActivityPage } from '../pages/activity.page';
import { SettingsPage } from '../pages/settings.page';
import { signInAs } from '../support/session';

test.describe('Review sign-in activity, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openActivity(page: Page, kind: 'mocks' | 'none' = 'mocks'): Promise<ActivityPage> {
    const activity = new ActivityPage(page);
    await signInAs(page);
    await activity.showMockActivity(kind);
    await activity.open();
    await expect(kind === 'none' ? activity.empty : activity.rows.first()).toBeVisible();
    return activity;
  }

  test('default', async ({ page }) => {
    await openActivity(page);
    await expect(page).toHaveScreenshot('default.png', { fullPage: true });
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openActivity(page);
    await expect(page).toHaveScreenshot('default-dark.png', { fullPage: true });
  });

  test('default on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openActivity(page);
    await expect(page).toHaveScreenshot('default-phone.png', { fullPage: true });
  });

  test('filtered', async ({ page }) => {
    const activity = await openActivity(page);
    await activity.choose('App access');
    await expect(activity.rows).toHaveCount(3);
    await expect(page).toHaveScreenshot('filtered.png', { fullPage: true });
  });

  test('empty', async ({ page }) => {
    await openActivity(page, 'none');
    await expect(page).toHaveScreenshot('empty.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    const activity = new ActivityPage(page);
    await signInAs(page);
    await activity.holdActivity();
    await activity.open();
    await expect(activity.loading).toBeVisible();
    await expect(page).toHaveScreenshot('loading.png', { fullPage: true, animations: 'disabled' });
  });

  test('error', async ({ page }) => {
    const activity = new ActivityPage(page);
    await signInAs(page);
    await activity.failActivityOnce();
    await activity.open();
    await expect(activity.failed).toBeVisible();
    await expect(page).toHaveScreenshot('error.png', { fullPage: true });
  });

  test('the Settings Activity card', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.open();
    await expect(settings.viewActivity).toBeVisible();
    await expect(settings.activity).toHaveScreenshot('settings-activity-card.png');
  });
});
