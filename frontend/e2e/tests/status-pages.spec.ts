// Acceptance Test
// Traces to: docs/screen-composition.md (Status pages)
// Description: Not found, forbidden, server error and offline each say what happened and offer a way forward.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { StatusPage } from '../pages/status.page';

test.describe('Status pages', () => {
  test('an unknown address says the page is missing and leads back to the apps', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/no/such/page');

    await expect(status.heading).toHaveText('That door doesn’t open anywhere');
    await expect(status.code).toHaveText('404.');
    await expect(status.message).toHaveText('The page you’re looking for moved or never existed.');
    await status.backToApps.click();
    await expect(new DashboardPage(page).heading).toBeVisible();
  });

  test('forbidden says the account cannot open the page', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/forbidden');

    await expect(status.heading).toHaveText('You don’t have a key for this one');
    await expect(status.code).toHaveText('403.');
    await expect(status.backToApps).toBeVisible();
  });

  test('server error offers to try again and to go back', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/error');

    await expect(status.heading).toHaveText('Something went wrong on our side');
    await expect(status.code).toHaveText('500.');
    await expect(status.tryAgain).toBeVisible();
    await expect(status.backToApps).toBeVisible();
    await status.tryAgain.click();
    await expect(new DashboardPage(page).heading).toBeVisible();
  });

  test('offline says a connection is needed and offers to try again', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/offline');

    await expect(status.heading).toHaveText('You’re offline');
    await expect(status.message).toContainText('Reconnect and we’ll pick up where you left off.');
    await expect(status.tryAgain).toBeVisible();
  });
});
