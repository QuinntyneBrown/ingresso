// Acceptance Test
// Traces to: L2-104, L2-105, L2-106
// Description: Settings → Apps and the register-app and client-secret dialogs look as designed in docs/mocks (settings: apps, apps-empty, apps-loading, apps-error; register-app: default, invalid, busy, error; client-secret: default, copied).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { ClientSecretDialog } from '../pages/client-secret.dialog';
import { RegisterAppDialog } from '../pages/register-app.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAsAdministrator } from '../support/session';

test.describe('Register an app, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openSettings(page: Page): Promise<SettingsPage> {
    const settings = new SettingsPage(page);
    await signInAsAdministrator(page);
    await settings.showMockProfile();
    return settings;
  }

  async function openDialog(page: Page): Promise<RegisterAppDialog> {
    const settings = await openSettings(page);
    const dialog = new RegisterAppDialog(page);
    await settings.showMockApps();
    await dialog.showMockApis();
    await settings.open();
    await settings.registerApp.click();
    await expect(dialog.scope('Sample API · sample-api.read')).toBeVisible();
    return dialog;
  }

  test('apps', async ({ page }) => {
    const settings = await openSettings(page);
    await settings.showMockApps();
    await settings.open();
    await expect(settings.appRows).toHaveCount(3);
    await settings.profileShown();
    await expect(page).toHaveScreenshot('apps.png', { fullPage: true });
  });

  test('apps in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const settings = await openSettings(page);
    await settings.showMockApps();
    await settings.open();
    await expect(settings.appRows).toHaveCount(3);
    await settings.profileShown();
    await expect(page).toHaveScreenshot('apps-dark.png', { fullPage: true });
  });

  test('apps on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const settings = await openSettings(page);
    await settings.showMockApps();
    await settings.open();
    await expect(settings.appRows).toHaveCount(3);
    await settings.profileShown();
    await expect(page).toHaveScreenshot('apps-phone.png', { fullPage: true });
  });

  test('apps empty', async ({ page }) => {
    const settings = await openSettings(page);
    await settings.showNoApps();
    await settings.open();
    await expect(settings.noApps).toBeVisible();
    await expect(settings.apps).toHaveScreenshot('apps-empty.png');
  });

  test('apps loading', async ({ page }) => {
    const settings = await openSettings(page);
    await settings.holdApps();
    await settings.open();
    await expect(settings.appsLoading).toBeVisible();
    await expect(settings.apps).toHaveScreenshot('apps-loading.png');
  });

  test('apps error', async ({ page }) => {
    const settings = await openSettings(page);
    await settings.failAppsOnce();
    await settings.open();
    await expect(settings.appsFailed).toBeVisible();
    await expect(settings.apps).toHaveScreenshot('apps-error.png');
  });

  test('register default', async ({ page }) => {
    const dialog = await openDialog(page);
    await expect(dialog.dialog).toHaveScreenshot('register-default.png');
  });

  test('register invalid', async ({ page }) => {
    const dialog = await openDialog(page);
    await dialog.fill({ name: '', redirectUris: ['notes.example.com/signin-oidc'] });
    await dialog.register.click();
    await expect(dialog.summary).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('register-invalid.png');
  });

  test('register busy', async ({ page }) => {
    const dialog = await openDialog(page);
    await dialog.holdRegistration();
    await dialog.fill({
      name: 'Notes',
      redirectUris: ['https://notes.example.com/signin-oidc'],
      postLogoutRedirectUris: ['https://notes.example.com/signout-callback-oidc'],
      frontChannelLogoutUri: 'https://notes.example.com/frontchannel-logout',
      scopes: ['Sample API · sample-api.read'],
      confidential: true,
    });
    await dialog.register.click();
    await expect(dialog.registering).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('register-busy.png');
  });

  test('register error', async ({ page }) => {
    const dialog = await openDialog(page);
    await dialog.failNextRegistration();
    await dialog.fill({
      name: 'Notes',
      redirectUris: ['https://notes.example.com/signin-oidc'],
      postLogoutRedirectUris: ['https://notes.example.com/signout-callback-oidc'],
      frontChannelLogoutUri: 'https://notes.example.com/frontchannel-logout',
      scopes: ['Sample API · sample-api.read'],
      confidential: true,
    });
    await dialog.register.click();
    await expect(dialog.failed).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('register-error.png');
  });

  test('client secret and copied', async ({ page }) => {
    const dialog = await openDialog(page);
    const secret = new ClientSecretDialog(page);
    await secret.allowClipboard();
    await dialog.registerAsMockBudget();
    await dialog.fill({
      name: 'Budget',
      redirectUris: ['https://budget.example.com/signin-oidc'],
      confidential: true,
    });
    await dialog.register.click();
    await expect(secret.warning).toBeVisible();
    await expect(secret.dialog).toHaveScreenshot('client-secret-default.png');

    await secret.copySecret.click();
    await expect(secret.copied).toHaveText('Client secret copied');
    await expect(secret.dialog).toHaveScreenshot('client-secret-copied.png');
  });
});
