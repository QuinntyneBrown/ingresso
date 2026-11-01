import { expect, test } from '../fixtures';
import { AuthorizeErrorPage } from '../pages/authorize-error.page';
import { DashboardPage } from '../pages/dashboard.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { SignInPage } from '../pages/sign-in.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { SignedOutPage } from '../pages/signed-out.page';
import { signInAs } from '../support/session';

test.describe('Sign out everywhere', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  async function signInToTheSampleApp(app: SampleAppPage): Promise<void> {
    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();
    await expect(app.signedInAs).toBeVisible();
  }

  // Acceptance Test
  // Traces to: L2-100
  // Description: Signing out in the sample app ends the ingresso session too and returns to the app, signed out.
  test('signing out of the app signs out of ingresso', async ({ page }) => {
    const app = new SampleAppPage(page);
    const signIn = new SignInPage(page);
    await signInAs(page);
    await signInToTheSampleApp(app);

    await app.signOut.click();
    await app.waitUntilShown();

    await expect(app.signInWithIngresso).toBeVisible();
    await signIn.openWithoutSession('/');
    await signIn.waitUntilShown();
  });

  // Acceptance Test
  // Traces to: L2-101
  // Description: Signing out of ingresso lists the sample app as signed out, and the sample app's session has ended.
  test('signing out of ingresso signs out of the app', async ({ page }) => {
    const app = new SampleAppPage(page);
    const dashboard = new DashboardPage(page);
    const dialog = new SignOutDialog(page);
    const signedOut = new SignedOutPage(page);
    await signInAs(page);
    await signInToTheSampleApp(app);
    await dashboard.openSignedIn();

    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await dialog.signOut.click();
    await signedOut.waitUntilShown();

    await expect(signedOut.heading).toHaveText('You’re signed out');
    await expect(signedOut.apps).toHaveText(['Sample app']);
    await app.open();
    await expect(app.signInWithIngresso).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-102
  // Description: A refused sign-out request shows the error page with the sign-out wording.
  test('a sign-out request ingresso cannot trust says the app cannot sign the person out', async ({
    page,
  }) => {
    const error = new AuthorizeErrorPage(page);

    await error.open('sign-out');

    await expect(error.heading).toHaveText('This app can’t sign you out with ingresso');
  });
});
