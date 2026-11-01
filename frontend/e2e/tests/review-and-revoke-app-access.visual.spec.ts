// Acceptance Test
// Traces to: L2-128, L2-129
// Description: The Connected apps card and the revoke-access dialog look as designed in docs/mocks (settings: default, connected-empty, connected-loading, connected-error; revoke-access: default, busy, error).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { RevokeAccessDialog } from '../pages/revoke-access.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAs } from '../support/session';

test.describe('Review and revoke app access, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openSettings(page: Page, apps: 'mocks' | 'none' = 'mocks'): Promise<SettingsPage> {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.showMockProfile();
    await settings.showMockConnectedApps(apps);
    await settings.open();
    await settings.profileShown();
    return settings;
  }

  async function openRevoke(page: Page): Promise<RevokeAccessDialog> {
    const settings = await openSettings(page);
    const revoke = new RevokeAccessDialog(page);
    await settings.revokeAccessFor('Sample app').click();
    await expect(revoke.dialog).toBeVisible();
    return revoke;
  }

  test('connected apps', async ({ page }) => {
    const settings = await openSettings(page);
    await expect(settings.connectedRows).toHaveCount(2);
    await expect(settings.connectedApps).toHaveScreenshot('connected.png');
  });

  test('connected apps in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const settings = await openSettings(page);
    await expect(settings.connectedRows).toHaveCount(2);
    await expect(settings.connectedApps).toHaveScreenshot('connected-dark.png');
  });

  test('connected apps on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const settings = await openSettings(page);
    await expect(settings.connectedRows).toHaveCount(2);
    await expect(settings.connectedApps).toHaveScreenshot('connected-phone.png');
  });

  test('no connected apps', async ({ page }) => {
    const settings = await openSettings(page, 'none');
    await expect(settings.noConnectedApps).toBeVisible();
    await expect(settings.connectedApps).toHaveScreenshot('connected-empty.png');
  });

  test('connected apps loading', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.holdConnectedApps();
    await settings.open();
    await expect(settings.connectedLoading).toBeVisible();
    await expect(settings.connectedApps).toHaveScreenshot('connected-loading.png');
  });

  test('connected apps error', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.failConnectedAppsOnce();
    await settings.open();
    await expect(settings.connectedFailed).toBeVisible();
    await expect(settings.connectedApps).toHaveScreenshot('connected-error.png');
  });

  test('revoke access', async ({ page }) => {
    const revoke = await openRevoke(page);
    await expect(revoke.dialog).toHaveScreenshot('revoke-access.png');
  });

  test('revoke access in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const revoke = await openRevoke(page);
    await expect(revoke.dialog).toHaveScreenshot('revoke-access-dark.png');
  });

  test('revoke access busy', async ({ page }) => {
    const revoke = await openRevoke(page);
    await revoke.holdRevoke();
    await revoke.revoke.click();
    await expect(revoke.revoking).toBeVisible();
    await expect(revoke.dialog).toHaveScreenshot('revoke-access-busy.png');
  });

  test('revoke access error', async ({ page }) => {
    const revoke = await openRevoke(page);
    await revoke.failNextRevoke();
    await revoke.revoke.click();
    await expect(revoke.failed).toBeVisible();
    await expect(revoke.dialog).toHaveScreenshot('revoke-access-error.png');
  });
});
