import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { signInAsNewPerson, signInOnAnotherDevice } from '../support/session';

test.describe('See and end other sessions', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-132
  // Description: Devices lists this device, marked, and the person's other device by browser and system.
  test('your devices are listed', async ({ page, browser, baseURL }) => {
    const settings = new SettingsPage(page);
    const email = await signInAsNewPerson(page);
    const phone = await signInOnAnotherDevice(browser, baseURL!, email);

    await settings.open();

    await expect(settings.deviceRows).toHaveCount(2);
    await expect(settings.thisDevice).toContainText('Active now');
    await expect(settings.device('Safari on iPhone')).toContainText(/Signed in \d{1,2} [A-Z][a-z]{2} \d{4}/);
    await expect(settings.endSessionOn('Safari on iPhone')).toBeVisible();
    await phone.context.close();
  });

  // Acceptance Test
  // Traces to: L2-132
  // Description: Signed in only here, the card says so and offers no Sign out of all other devices.
  test('only this device', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsNewPerson(page);

    await settings.open();

    await expect(settings.onlyThisDevice).toBeVisible();
    await expect(settings.deviceRows).toHaveCount(1);
    await expect(settings.signOutOtherDevices).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-132
  // Description: When the devices can't be loaded, the card says so, and Try again loads them.
  test('a failed load says so and Try again recovers', async ({ page }) => {
    const settings = new SettingsPage(page);
    await signInAsNewPerson(page);
    await settings.failDevicesOnce();

    await settings.open();
    await expect(settings.devicesFailed).toContainText('We couldn’t load your devices');
    await settings.devicesTryAgain.click();

    await expect(settings.onlyThisDevice).toBeVisible();
  });
});
