import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { RegisterAppDialog } from '../pages/register-app.dialog';
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

  /** A name no other test run has used. */
  const unique = (name: string) => `${name} ${Date.now().toString(36)}`;

  // Acceptance Test
  // Traces to: L2-105
  // Description: An administrator registers a public app from the dialog; it closes, a toast names the app, and it is listed.
  test('an administrator registers a public app', async ({ page }) => {
    const settings = new SettingsPage(page);
    const dialog = new RegisterAppDialog(page);
    const shell = new AppShell(page);
    const name = unique('Notes');
    await signInAsAdministrator(page);
    await settings.open();

    await settings.registerApp.click();
    await expect(dialog.public).toBeChecked();
    await dialog.fill({
      name,
      redirectUris: ['https://notes.example.com/signin-oidc', 'http://localhost:5300/signin-oidc'],
      postLogoutRedirectUris: ['https://notes.example.com/signout-callback-oidc'],
      frontChannelLogoutUri: 'https://notes.example.com/frontchannel-logout',
      scopes: ['Sample API · sample-api.read'],
    });
    await dialog.register.click();

    await expect(dialog.dialog).toBeHidden();
    await expect(shell.toast('App registered')).toContainText(name);
    await expect(settings.app(name)).toContainText('Public · client ID');
  });

  // Acceptance Test
  // Traces to: L2-105
  // Description: Entries breaking the rules register nothing; the dialog shows a summary and each field's message.
  test('invalid entries show what to fix', async ({ page }) => {
    const settings = new SettingsPage(page);
    const dialog = new RegisterAppDialog(page);
    await signInAsAdministrator(page);
    await settings.open();
    await settings.registerApp.click();

    await dialog.fill({ name: '', redirectUris: ['notes.example.com/signin-oidc'] });
    await dialog.register.click();

    await expect(dialog.summary).toContainText('Fix 2 things before you continue');
    await expect(dialog.name).toHaveAccessibleDescription(/Enter a name for the app\./);
    await expect(dialog.redirectUris).toHaveAccessibleDescription(
      /The address 'notes\.example\.com\/signin-oidc' must be a full address/,
    );
    await expect(dialog.name).toBeFocused();
  });

  // Acceptance Test
  // Traces to: L2-105
  // Description: A name already registered keeps the dialog open and says so on the name field.
  test('a name in use says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    const dialog = new RegisterAppDialog(page);
    await signInAsAdministrator(page);
    await settings.open();
    await settings.registerApp.click();

    await dialog.fill({ name: 'Sample app', redirectUris: ['https://sample.example.com/signin-oidc'] });
    await dialog.register.click();

    await expect(dialog.name).toHaveAccessibleDescription(/An app named Sample app is already registered\./);
    await expect(dialog.dialog).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-105
  // Description: When registering fails for another reason, the dialog stays open with the entries kept and says so.
  test('a failed registration keeps the entries', async ({ page }) => {
    const settings = new SettingsPage(page);
    const dialog = new RegisterAppDialog(page);
    const name = unique('Budget');
    await signInAsAdministrator(page);
    await settings.open();
    await settings.registerApp.click();
    await dialog.failNextRegistration();

    await dialog.fill({ name, redirectUris: ['https://budget.example.com/signin-oidc'] });
    await dialog.register.click();

    await expect(dialog.failed).toBeVisible();
    await expect(dialog.name).toHaveValue(name);
  });
});
