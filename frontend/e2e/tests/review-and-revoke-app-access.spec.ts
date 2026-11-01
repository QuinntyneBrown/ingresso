import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { ConsentPage } from '../pages/consent.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { RevokeAccessDialog } from '../pages/revoke-access.dialog';
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

  // Acceptance Test
  // Traces to: L2-129
  // Description: Revoke asks first, naming the app and what it will lose; Cancel changes nothing.
  test('revoke asks first and Cancel keeps the app', async ({ page }) => {
    const settings = new SettingsPage(page);
    const revoke = new RevokeAccessDialog(page);
    await signInAsNewPerson(page);
    await approveThroughApi(page, SAMPLE_APP_CLIENT_ID, ALL_SCOPES);
    await settings.open();

    await settings.revokeAccessFor('Sample app').click();
    await expect(revoke.dialog).toHaveAccessibleName('Revoke Sample app’s access?');
    await expect(revoke.dialog).toContainText(
      'It won’t be able to see your display name or email address, use Sample API for you, or stay signed in.',
    );
    await revoke.cancel.click();

    await expect(revoke.dialog).toBeHidden();
    await expect(settings.connectedApp('Sample app')).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-129
  // Description: Revoke access removes the app from the list and a toast confirms it.
  test('revoking removes the app and says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    const revoke = new RevokeAccessDialog(page);
    const shell = new AppShell(page);
    await signInAsNewPerson(page);
    await approveThroughApi(page, SAMPLE_APP_CLIENT_ID, ALL_SCOPES);
    await settings.open();

    await settings.revokeAccessFor('Sample app').click();
    await revoke.revoke.click();

    await expect(shell.toast('Access revoked')).toContainText('Sample app has to ask again next time.');
    await expect(revoke.dialog).toBeHidden();
    await expect(settings.noConnectedApps).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-129
  // Description: When revoking fails, the dialog says so and stays open, and the app stays connected.
  test('a failed revoke says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    const revoke = new RevokeAccessDialog(page);
    await signInAsNewPerson(page);
    await approveThroughApi(page, SAMPLE_APP_CLIENT_ID, ALL_SCOPES);
    await settings.open();
    await revoke.failNextRevoke();

    await settings.revokeAccessFor('Sample app').click();
    await revoke.revoke.click();

    await expect(revoke.failed).toBeVisible();
    await expect(revoke.dialog).toBeVisible();
    await revoke.cancel.click();
    await expect(settings.connectedApp('Sample app')).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-131, L2-128
  // Description: An app the person signed in to shows as used; after revoking it, signing in to it asks again.
  test('after revoking, the app asks again', async ({ page }) => {
    const sample = new SampleAppPage(page);
    const consent = new ConsentPage(page);
    const settings = new SettingsPage(page);
    const revoke = new RevokeAccessDialog(page);
    await signInAsNewPerson(page);
    await sample.open();
    await sample.signInWithIngresso.click();
    await sample.waitUntilSignedIn();

    await settings.open();
    await expect(settings.connectedApp('Sample app')).toContainText(/· Last used /);
    await settings.revokeAccessFor('Sample app').click();
    await revoke.revoke.click();
    await expect(settings.noConnectedApps).toBeVisible();

    await sample.forgetItsSession();
    await sample.open();
    await sample.signInWithIngresso.click();

    await consent.waitUntilShown();
    await expect(consent.heading).toHaveText('Sample app wants to use your ingresso account');
  });
});
