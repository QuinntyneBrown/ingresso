// Acceptance Test
// Traces to: L2-121, L2-122, L2-125, L2-126
// Description: The consent page and the first-party option look as designed in docs/mocks (consent: default, loading, busy, error, new-scopes; register-app: the Consent option).
import { expect, test } from '../fixtures';
import { ConsentPage } from '../pages/consent.page';
import { RegisterAppDialog } from '../pages/register-app.dialog';
import { SettingsPage } from '../pages/settings.page';
import { signInAsAdministrator } from '../support/session';

test.describe('Approve what an app can see, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  test('consent', async ({ page }) => {
    await new ConsentPage(page).openMock();
    await expect(page).toHaveScreenshot('consent.png', { fullPage: true });
  });

  test('consent in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await new ConsentPage(page).openMock();
    await expect(page).toHaveScreenshot('consent-dark.png', { fullPage: true });
  });

  test('consent on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await new ConsentPage(page).openMock();
    await expect(page).toHaveScreenshot('consent-phone.png', { fullPage: true });
  });

  test('consent loading', async ({ page }) => {
    await new ConsentPage(page).openLoading();
    await expect(page.getByText('Checking what the app asks for')).toBeVisible();
    await expect(page).toHaveScreenshot('consent-loading.png', { fullPage: true });
  });

  test('consent busy', async ({ page }) => {
    const consent = new ConsentPage(page);
    await consent.openMock();
    await consent.holdAllow();
    await consent.allow.click();
    await expect(consent.allow).toHaveText('Allowing…');
    await expect(page).toHaveScreenshot('consent-busy.png', { fullPage: true });
  });

  test('consent error', async ({ page }) => {
    const consent = new ConsentPage(page);
    await consent.openMock();
    await consent.failNextAllow();
    await consent.allow.click();
    await expect(consent.failed).toBeVisible();
    await expect(page).toHaveScreenshot('consent-error.png', { fullPage: true });
  });

  test('consent for new scopes', async ({ page }) => {
    await new ConsentPage(page).openMock({ newScopes: true });
    await expect(page).toHaveScreenshot('consent-new-scopes.png', { fullPage: true });
  });

  test('first-party option', async ({ page }) => {
    const settings = new SettingsPage(page);
    const register = new RegisterAppDialog(page);
    await signInAsAdministrator(page);
    await register.showMockApis();
    await settings.open();
    await settings.registerApp.click();
    await register.firstParty.scrollIntoViewIfNeeded();
    await expect(register.dialog).toHaveScreenshot('first-party-option.png');
  });
});
