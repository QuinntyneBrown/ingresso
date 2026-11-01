import { expect, test } from '../fixtures';
import { AuthorizeErrorPage } from '../pages/authorize-error.page';
import { SampleAppPage } from '../pages/sample-app.page';
import { SignInPage } from '../pages/sign-in.page';
import { MAYA, signInAs } from '../support/session';

test.describe('Sign in to an app with ingresso', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  const newEmail = () =>
    `app-person-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`;

  // Acceptance Test
  // Traces to: L2-092
  // Description: With an ingresso session, Sign in with ingresso returns to the app signed in, without an ingresso screen.
  test('a signed-in person goes straight back to the app, signed in', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await app.open();

    await app.signInWithIngresso.click();
    await app.waitUntilShown();

    await expect(app.signedInAs).toHaveText(`Signed in as ${MAYA}`);
  });

  // Acceptance Test
  // Traces to: L2-093
  // Description: Without a session, the sign-in page names the app, and the emailed link returns to the app signed in.
  test('a person without a session signs in by email link and returns to the app', async ({ page }) => {
    const app = new SampleAppPage(page);
    const signIn = new SignInPage(page);
    const email = newEmail();
    await app.open();

    await app.signInWithIngresso.click();
    await signIn.waitUntilShown();
    await expect(signIn.heading).toHaveText('Sign in to continue to Sample app');
    await signIn.requestLink(email);
    await expect(signIn.lead).toContainText('takes you back to Sample app');
    await signIn.followLink(await signIn.linkFromMailbox(email));
    await app.waitUntilShown();

    await expect(app.signedInAs).toHaveText(`Signed in as ${email}`);
  });

  // Acceptance Test
  // Traces to: L2-094
  // Description: A request from an unknown app shows the authorize error page with a way to the person's apps.
  test('an unknown app cannot sign in and the page says so', async ({ page }) => {
    const error = new AuthorizeErrorPage(page);

    await error.openForUnknownApp();

    await expect(error.heading).toHaveText('This app can’t sign in with ingresso');
    await expect(error.goToYourApps).toHaveAttribute('href', '/');
  });
});
