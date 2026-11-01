import { expect, test } from '../fixtures';
import { SampleAppPage } from '../pages/sample-app.page';
import { MAYA, signInAs } from '../support/session';

test.describe("Call an app's API with a token", () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API and the sample app.');

  // Acceptance Test
  // Traces to: L2-098
  // Description: After signing in with ingresso, the sample app shows data from its own API, fetched with the access token.
  test('the sample app shows data from its API after sign-in', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await app.open();

    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();

    await expect(app.apiResult).toHaveText(
      `Your API says: hello, ${MAYA}. Scope: openid profile email sample-api.read offline_access`,
    );
  });
});
