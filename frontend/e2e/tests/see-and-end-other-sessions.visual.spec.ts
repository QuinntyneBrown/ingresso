// Acceptance Test
// Traces to: L2-132, L2-133, L2-134
// Description: The Devices card and the end-session dialog look as designed in docs/mocks (settings: default, devices-only, devices-loading, devices-error; end-session: default, all, busy, error).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { EndSessionDialog } from '../pages/end-session.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAs } from '../support/session';

test.describe('See and end other sessions, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function openSettings(page: Page, devices: 'mocks' | 'only' = 'mocks'): Promise<SettingsPage> {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.showMockProfile();
    await settings.showMockConnectedApps();
    await settings.showMockDevices(devices);
    await settings.open();
    await settings.profileShown();
    return settings;
  }

  async function openEnd(page: Page, which: 'one' | 'all' = 'one'): Promise<EndSessionDialog> {
    const settings = await openSettings(page);
    const end = new EndSessionDialog(page);
    await (
      which === 'all' ? settings.signOutOtherDevices : settings.endSessionOn('Safari on iPhone')
    ).click();
    await expect(end.dialog).toBeVisible();
    return end;
  }

  test('devices', async ({ page }) => {
    const settings = await openSettings(page);
    await expect(settings.deviceRows).toHaveCount(3);
    await expect(settings.devices).toHaveScreenshot('devices.png');
  });

  test('devices in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const settings = await openSettings(page);
    await expect(settings.deviceRows).toHaveCount(3);
    await expect(settings.devices).toHaveScreenshot('devices-dark.png');
  });

  test('devices on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const settings = await openSettings(page);
    await expect(settings.deviceRows).toHaveCount(3);
    await expect(settings.devices).toHaveScreenshot('devices-phone.png');
  });

  test('only this device', async ({ page }) => {
    const settings = await openSettings(page, 'only');
    await expect(settings.onlyThisDevice).toBeVisible();
    await expect(settings.devices).toHaveScreenshot('devices-only.png');
  });

  test('devices loading', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.holdDevices();
    await settings.open();
    await expect(settings.devicesLoading).toBeVisible();
    await expect(settings.devices).toHaveScreenshot('devices-loading.png');
  });

  test('devices error', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAs(page);
    await settings.failDevicesOnce();
    await settings.open();
    await expect(settings.devicesFailed).toBeVisible();
    await expect(settings.devices).toHaveScreenshot('devices-error.png');
  });

  test('end session', async ({ page }) => {
    const end = await openEnd(page);
    await expect(end.dialog).toHaveScreenshot('end-session.png');
  });

  test('end session in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const end = await openEnd(page);
    await expect(end.dialog).toHaveScreenshot('end-session-dark.png');
  });

  test('sign out of all other devices', async ({ page }) => {
    const end = await openEnd(page, 'all');
    await expect(end.dialog).toHaveScreenshot('end-session-all.png');
  });

  test('end session busy', async ({ page }) => {
    const end = await openEnd(page);
    await end.holdEnd();
    await end.endSession.click();
    await expect(end.ending).toBeVisible();
    await expect(end.dialog).toHaveScreenshot('end-session-busy.png');
  });

  test('end session error', async ({ page }) => {
    const end = await openEnd(page);
    await end.failNextEnd();
    await end.endSession.click();
    await expect(end.failed).toBeVisible();
    await expect(end.dialog).toHaveScreenshot('end-session-error.png');
  });
});
