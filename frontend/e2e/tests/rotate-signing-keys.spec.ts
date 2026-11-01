import { expect, test } from '../fixtures';
import { SampleAppPage } from '../pages/sample-app.page';
import { MAYA, signInAs } from '../support/session';
import { rotateSigningKeys } from '../support/signing-keys';

test.describe('Rotate signing keys', () => {
  test.skip(
    !!process.env['E2E_FAKE_API'] || !!process.env['PW_BASE_URL'],
    "Needs the suite's own API, sample app and database.",
  );

  // Acceptance Test
  // Traces to: L2-137
  // Description: An app signed in before a rotation renews its token, now signed with the new key, and its API still accepts it.
  test('a signed-in app keeps working across a key rotation', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();

    await rotateSigningKeys();
    await app.reopenUntilTheAccessTokenExpires();

    await expect(app.renewals).toBeVisible();
    await expect(app.apiResult).toHaveText(
      `Your API says: hello, ${MAYA}. Scope: openid profile email sample-api.read offline_access`,
    );
  });

  // Acceptance Test
  // Traces to: L2-137
  // Description: Right after a rotation, a person signs in to an app with an ID token signed by the new key.
  test('an app signs a person in right after a key rotation', async ({ page }) => {
    const app = new SampleAppPage(page);
    await signInAs(page);
    await rotateSigningKeys();

    await app.open();
    await app.signInWithIngresso.click();
    await app.waitUntilSignedIn();

    await expect(app.signedInAs).toHaveText(`Signed in as ${MAYA}`);
  });
});
