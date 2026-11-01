// Acceptance Test
// Traces to: L2-101, L2-102
// Description: The signed-out page and the sign-out error page look as designed in docs/mocks (signed-out: signing-out, done; authorize-error: sign-out).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { AuthorizeErrorPage } from '../pages/authorize-error.page';
import { DashboardPage } from '../pages/dashboard.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { SignedOutPage } from '../pages/signed-out.page';
import { signInAs } from '../support/session';

test.describe('Sign out everywhere, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  /** Signs in to ingresso and the sample app, then signs out of ingresso from the dashboard. */
  async function signOutWithAnApp(page: Page): Promise<SignedOutPage> {
    const app = new SampleAppPage(page);
    const dashboard = new DashboardPage(page);
    const signedOut = new SignedOutPage(page);
    await signInAs(page);
    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();
    await dashboard.openSignedIn();
    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await new SignOutDialog(page).signOut.click();
    await signedOut.waitUntilShown();
    return signedOut;
  }

  test('signing out', async ({ page }) => {
    await new SignedOutPage(page).holdAppSignOuts();
    const signedOut = await signOutWithAnApp(page);
    await expect(signedOut.heading).toHaveText('Signing you out');
    await expect(page).toHaveScreenshot('signing-out.png');
  });

  test('done', async ({ page }) => {
    const signedOut = await signOutWithAnApp(page);
    await expect(signedOut.apps).toHaveText(['Sample app']);
    await expect(page).toHaveScreenshot('done.png');
  });

  test('done in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const signedOut = await signOutWithAnApp(page);
    await expect(signedOut.apps).toHaveText(['Sample app']);
    await expect(page).toHaveScreenshot('done-dark.png');
  });

  test('done on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    const signedOut = await signOutWithAnApp(page);
    await expect(signedOut.apps).toHaveText(['Sample app']);
    await expect(page).toHaveScreenshot('done-phone.png');
  });

  test('sign-out error', async ({ page }) => {
    const error = new AuthorizeErrorPage(page);
    await error.open('sign-out');
    await expect(error.heading).toBeVisible();
    await expect(page).toHaveScreenshot('authorize-error-sign-out.png');
  });
});
