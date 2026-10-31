// Acceptance Test
// Traces to: L2-033
// Description: Given no session, when a page other than sign-in is opened, then the app redirects to sign-in.
import { expect, test } from '../fixtures';
import { SignInPage } from '../pages/sign-in.page';

test.describe('Authentication', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'The fake API always has a session.');

  for (const path of ['/', '/directory']) {
    test(`opening ${path} without a session sends the visitor to sign in`, async ({ page }) => {
      const signIn = new SignInPage(page);

      await signIn.openWithoutSession(path);

      await signIn.waitUntilShown();
      expect(new URL(page.url()).pathname).toBe('/sign-in');
    });
  }
});
