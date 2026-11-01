// Acceptance Test
// Traces to: L2-093, L2-094
// Description: Signing in for an app, and the authorize error page, look as designed in docs/mocks (sign-in for-app, for-app-sent; authorize-error).
import { expect, test } from '../fixtures';
import { AuthorizeErrorPage } from '../pages/authorize-error.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { SignInPage } from '../pages/sign-in.page';

test.describe('Sign in to an app, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  async function openForApp(page: import('@playwright/test').Page): Promise<SignInPage> {
    const app = new SampleAppPage(page);
    const signIn = new SignInPage(page);
    await app.open();
    await app.signInWithIngresso.click();
    await signIn.waitUntilShown();
    await expect(signIn.heading).toHaveText('Sign in to continue to Sample app');
    return signIn;
  }

  test('for an app', async ({ page }) => {
    await openForApp(page);
    await expect(page).toHaveScreenshot('for-app.png');
  });

  test('for an app in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openForApp(page);
    await expect(page).toHaveScreenshot('for-app-dark.png');
  });

  test('for an app, link sent', async ({ page }) => {
    const signIn = await openForApp(page);
    await signIn.requestLink('maya@northwind.com');
    await expect(signIn.lead).toContainText('takes you back to Sample app');
    await expect(page).toHaveScreenshot('for-app-sent.png');
  });

  test('authorize error', async ({ page }) => {
    const error = new AuthorizeErrorPage(page);
    await error.open();
    await expect(error.heading).toBeVisible();
    await expect(page).toHaveScreenshot('authorize-error.png');
  });

  test('authorize error on a phone in dark', async ({ page }) => {
    const error = new AuthorizeErrorPage(page);
    await page.setViewportSize({ width: 390, height: 780 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await error.open();
    await expect(error.heading).toBeVisible();
    await expect(page).toHaveScreenshot('authorize-error-phone-dark.png');
  });
});
