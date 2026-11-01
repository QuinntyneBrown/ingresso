import { expect, test } from '../fixtures';
import { AppShell } from '../pages/app-shell';
import { DashboardPage } from '../pages/dashboard.page';
import { EndSessionDialog } from '../pages/end-session.dialog';
import { SettingsPage } from '../pages/settings.page';
import { SignInPage } from '../pages/sign-in.page';
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

  // Acceptance Test
  // Traces to: L2-133
  // Description: End session asks first, naming the device; Cancel keeps it.
  test('end session asks first and Cancel keeps the device', async ({ page, browser, baseURL }) => {
    const settings = new SettingsPage(page);
    const end = new EndSessionDialog(page);
    const email = await signInAsNewPerson(page);
    const phone = await signInOnAnotherDevice(browser, baseURL!, email);
    await settings.open();

    await settings.endSessionOn('Safari on iPhone').click();
    await expect(end.dialog).toHaveAccessibleName('End the session on Safari on iPhone?');
    await expect(end.dialog).toContainText('Safari on iPhone is signed out of ingresso straight away.');
    await end.cancel.click();

    await expect(end.dialog).toBeHidden();
    await expect(settings.device('Safari on iPhone')).toBeVisible();
    await phone.context.close();
  });

  // Acceptance Test
  // Traces to: L2-133, L2-031
  // Description: Ending another device's session removes it, says so, and that device is back at sign-in.
  test('ending a session signs the other device out', async ({ page, browser, baseURL }) => {
    const settings = new SettingsPage(page);
    const end = new EndSessionDialog(page);
    const shell = new AppShell(page);
    const email = await signInAsNewPerson(page);
    const phone = await signInOnAnotherDevice(browser, baseURL!, email);
    await settings.open();

    await settings.endSessionOn('Safari on iPhone').click();
    await end.endSession.click();

    await expect(shell.toast('Session ended')).toContainText('Safari on iPhone is signed out.');
    await expect(settings.onlyThisDevice).toBeVisible();
    await new DashboardPage(phone.page).openSignedIn();
    await expect(new SignInPage(phone.page).heading).toHaveText('Sign in to ingresso');
    await phone.context.close();
  });

  // Acceptance Test
  // Traces to: L2-133
  // Description: When ending fails, the dialog says so and stays open, and the device stays signed in.
  test('a failed end says so', async ({ page, browser, baseURL }) => {
    const settings = new SettingsPage(page);
    const end = new EndSessionDialog(page);
    const email = await signInAsNewPerson(page);
    const phone = await signInOnAnotherDevice(browser, baseURL!, email);
    await settings.open();
    await end.failNextEnd();

    await settings.endSessionOn('Safari on iPhone').click();
    await end.endSession.click();

    await expect(end.failed).toBeVisible();
    await expect(end.dialog).toBeVisible();
    await end.cancel.click();
    await expect(settings.device('Safari on iPhone')).toBeVisible();
    await phone.context.close();
  });
});
