import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { ClientSecretDialog } from '../pages/client-secret.dialog';
import { RegisterAppDialog } from '../pages/register-app.dialog';
import { RotateSecretDialog } from '../pages/rotate-secret.dialog';
import { SettingsPage } from '../pages/settings.page';
import { registerAppThroughApi } from '../support/apps';
import { signInAsAdministrator } from '../support/session';

test.describe('Manage registered apps', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-112
  // Description: Edit opens the dialog with the app's values filled in; saving new addresses confirms with a toast and keeps them.
  test("an administrator edits an app's addresses", async ({ page }) => {
    const settings = new SettingsPage(page);
    const shell = new AppShell(page);
    await signInAsAdministrator(page);
    const app = await registerAppThroughApi(page);
    await settings.open();

    await settings.chooseAction(app.name, 'Edit');
    const edit = new RegisterAppDialog(page, `Edit ${app.name}`);
    await expect(edit.name).toHaveValue(app.name);
    await expect(edit.redirectUris).toHaveValue('https://notes.example.com/signin-oidc');
    await expect(edit.fixedType).toBeVisible();
    await edit.redirectUris.fill(
      'https://notes.example.com/signin-oidc\nhttps://notes.example.com/oidc-callback',
    );
    await edit.save.click();

    await expect(shell.toast('App saved')).toBeVisible();
    await expect(edit.dialog).toBeHidden();
    await settings.chooseAction(app.name, 'Edit');
    await expect(edit.redirectUris).toHaveValue(
      'https://notes.example.com/signin-oidc\nhttps://notes.example.com/oidc-callback',
    );
  });

  // Acceptance Test
  // Traces to: L2-112
  // Description: Changes breaking the registration rules keep the dialog open with the registration messages.
  test('invalid changes show the registration messages', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    const app = await registerAppThroughApi(page);
    await settings.open();

    await settings.chooseAction(app.name, 'Edit');
    const edit = new RegisterAppDialog(page, `Edit ${app.name}`);
    await edit.name.fill('');
    await edit.save.click();

    await expect(edit.summary).toContainText('Enter a name for the app.');
    await expect(edit.dialog).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-112, L2-107
  // Description: Registering with "stay signed in" allows refresh tokens, and the edit dialog shows it.
  test('an app registered to stay signed in shows it when edited', async ({ page }) => {
    const settings = new SettingsPage(page);
    const register = new RegisterAppDialog(page);
    await signInAsAdministrator(page);
    await settings.open();
    const name = `Diary ${Date.now().toString(36)}`;

    await settings.registerApp.click();
    await register.fill({ name, redirectUris: ['https://diary.example.com/signin-oidc'] });
    await register.staySignedIn.check();
    await register.register.click();
    await expect(register.dialog).toBeHidden();

    await settings.chooseAction(name, 'Edit');
    await expect(new RegisterAppDialog(page, `Edit ${name}`).staySignedIn).toBeChecked();
  });

  // Acceptance Test
  // Traces to: L2-113
  // Description: Rotate secret asks first, then shows the new secret once; Done confirms the rotation with a toast.
  test('rotating a secret shows the new one once', async ({ page }) => {
    const settings = new SettingsPage(page);
    const shell = new AppShell(page);
    const rotate = new RotateSecretDialog(page);
    const secret = new ClientSecretDialog(page);
    await signInAsAdministrator(page);
    const app = await registerAppThroughApi(page, { confidential: true });
    await settings.open();

    await settings.chooseAction(app.name, 'Rotate secret');
    await expect(rotate.dialog).toContainText('stops working at once');
    await rotate.rotate.click();

    await expect(secret.dialog).toHaveAccessibleName(`${app.name} has a new secret`);
    await expect(secret.clientId).toHaveValue(app.clientId);
    await expect(secret.secret).not.toHaveValue(app.clientSecret!);
    await expect(secret.secret).toHaveValue(/^[A-Za-z0-9_-]{43}$/);
    await secret.done.click();
    await expect(shell.toast('Secret rotated')).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-113
  // Description: A public app's actions have no Rotate secret.
  test('a public app has no Rotate secret', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    const app = await registerAppThroughApi(page);
    await settings.open();

    await settings.actionsFor(app.name).click();

    await expect(settings.action('Edit')).toBeVisible();
    await expect(settings.action('Rotate secret')).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-113
  // Description: When the rotation fails, the dialog stays open and says so.
  test('a failed rotation says so', async ({ page }) => {
    const settings = new SettingsPage(page);
    const rotate = new RotateSecretDialog(page);
    await signInAsAdministrator(page);
    const app = await registerAppThroughApi(page, { confidential: true });
    await settings.open();
    await rotate.failNextRotation();

    await settings.chooseAction(app.name, 'Rotate secret');
    await rotate.rotate.click();

    await expect(rotate.failed).toBeVisible();
    await expect(rotate.dialog).toBeVisible();
  });
});
