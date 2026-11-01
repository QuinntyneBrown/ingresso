import { expect, test } from '../fixtures';
import { SampleAppPage } from '../pages/sample-app.page';
import { endIngressoSessionQuietly, MAYA, signInAs } from '../support/session';

test.describe('Stay signed in to an app', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  // Acceptance Test
  // Traces to: L2-107, L2-110
  // Description: After its access token expires, the sample app renews it silently and keeps calling its API without a new sign-in.
  test('the sample app keeps calling its API after its access token expires', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();
    await expect(app.apiResult).toContainText(`hello, ${MAYA}`);

    await app.reopenUntilTheAccessTokenExpires();

    await expect(app.renewals).toHaveText('Access token renewed quietly 1 time.');
    await expect(app.apiResult).toContainText(`hello, ${MAYA}`);
    await expect(app.signInWithIngresso).toBeHidden();
  });

  // Acceptance Test
  // Traces to: L2-110
  // Description: When the ingresso session has ended, the sample app's renewal is refused and it asks the person to sign in again.
  test('after the ingresso session ends the app asks to sign in again', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();
    await expect(app.apiResult).toContainText(`hello, ${MAYA}`);

    await endIngressoSessionQuietly(page);
    await app.reopenUntilTheAccessTokenExpires();

    await expect(app.sessionEnded).toBeVisible();
    await expect(app.signInWithIngresso).toBeVisible();
    await expect(app.apiResult).toBeHidden();
  });
});
