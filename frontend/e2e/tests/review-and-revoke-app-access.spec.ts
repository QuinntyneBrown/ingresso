import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { approveThroughApi, SAMPLE_APP_CLIENT_ID } from '../support/apps';
import { signInAsNewPerson } from '../support/session';

const ALL_SCOPES = 'openid profile email sample-api.read offline_access';

test.describe('Review and revoke app access', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  // Acceptance Test
  // Traces to: L2-128
  // Description: An app the person approved is listed with what it can do in plain words and when it was approved.
  test('an approved app is listed', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsNewPerson(page);
    await approveThroughApi(page, SAMPLE_APP_CLIENT_ID, ALL_SCOPES);

    await settings.open();

    const row = settings.connectedApp('Sample app');
    await expect(row).toContainText(
      'Can see your display name and email address, use Sample API for you and stay signed in when you’re not using it',
    );
    await expect(row).toContainText(/Approved \d{1,2} [A-Z][a-z]{2} \d{4} · Not used yet/);
  });

  // Acceptance Test
  // Traces to: L2-128
  // Description: A person who approved nothing is told there are no connected apps.
  test('no connected apps', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsNewPerson(page);

    await settings.open();

    await expect(settings.noConnectedApps).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-128
  // Description: When the list can't be loaded, the card says so, and Try again loads it.
  test('a failed load says so and Try again recovers', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsNewPerson(page);
    await settings.failConnectedAppsOnce();

    await settings.open();
    await expect(settings.connectedFailed).toContainText('We couldn’t load your connected apps');
    await settings.connectedTryAgain.click();

    await expect(settings.noConnectedApps).toBeVisible();
  });
});
