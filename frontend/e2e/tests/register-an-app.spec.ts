import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { signInAs, signInAsAdministrator } from '../support/session';

test.describe('Register an app from the dashboard', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-104
  // Description: An administrator sees the registered apps in Settings → Apps, each with its type and client ID.
  test('an administrator sees the registered apps', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);

    await settings.open();

    await expect(settings.app('Sample app')).toContainText('Public · client ID ingresso-sample-app');
    await expect(settings.registerApp).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-104
  // Description: Someone who is not an administrator sees no Apps card in Settings.
  test('a member sees no Apps card', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);

    await settings.open();

    await expect(settings.appearance).toBeVisible();
    await expect(settings.apps).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-104
  // Description: With no registered apps, the Apps card says so and offers Register an app.
  test('no apps says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    await settings.showNoApps();

    await settings.open();

    await expect(settings.noApps).toBeVisible();
    await expect(settings.registerApp).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-104
  // Description: While the list loads the card shows a loading state; a failed load says so and Try again loads it.
  test('loading, failure and Try again', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    await settings.failAppsOnce();

    await settings.open();
    await expect(settings.appsFailed).toContainText('We couldn’t load your apps');
    await settings.tryAgain.click();

    await expect(settings.app('Sample app')).toBeVisible();
    await expect(settings.appsFailed).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-104
  // Description: The Apps card shows a loading state until the list arrives.
  test('loading', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    await settings.holdApps();

    await settings.open();

    await expect(settings.appsLoading).toBeVisible();
  });
});
