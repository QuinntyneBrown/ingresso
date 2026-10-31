// Acceptance Test
// Traces to: L2-027, L2-028
// Description: Each sign-in state looks as designed in docs/mocks/pages/sign-in, in light and dark and on a phone.
import { expect, test } from '../fixtures';
import { SignInPage } from '../pages/sign-in.page';

test.describe('Sign in, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Sign-in needs the real API.');

  test('default', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await expect(page).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    const signIn = new SignInPage(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await signIn.open();
    await expect(page).toHaveScreenshot('default-dark.png');
  });

  test('default on a phone', async ({ page }) => {
    const signIn = new SignInPage(page);
    await page.setViewportSize({ width: 390, height: 780 });
    await signIn.open();
    await expect(page).toHaveScreenshot('default-phone.png');
  });

  test('invalid', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.requestLink('maya@northwind');
    await expect(signIn.errorSummary).toBeVisible();
    await expect(page).toHaveScreenshot('invalid.png');
  });

  test('check your inbox', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.requestLink('maya@northwind.com');
    await expect(signIn.heading).toHaveText('Check your inbox');
    await expect(page).toHaveScreenshot('sent.png');
  });

  for (const link of ['used', 'expired', 'invalid'] as const) {
    test(`link ${link}`, async ({ page }) => {
      const signIn = new SignInPage(page);
      await signIn.open(link);
      await expect(signIn.notice).toBeVisible();
      await expect(page).toHaveScreenshot(`link-${link}.png`);
    });
  }

  test('too many requests', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.answerLinkRequestsWith(429);
    await signIn.open();
    await signIn.requestLink('maya@northwind.com');
    await expect(signIn.notice).toBeVisible();
    await expect(page).toHaveScreenshot('rate-limited.png');
  });

  test('could not send', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.answerLinkRequestsWith(500);
    await signIn.open();
    await signIn.requestLink('maya@northwind.com');
    await expect(signIn.notice).toBeVisible();
    await expect(page).toHaveScreenshot('error.png');
  });
});
