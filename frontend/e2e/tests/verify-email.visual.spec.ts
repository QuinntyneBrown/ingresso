// Acceptance Test
// Traces to: L2-029
// Description: The verify-email screen and its states look as designed in docs/mocks/pages/verify-email.
import { expect, test } from '../fixtures';
import { VerifyEmailPage } from '../pages/verify-email.page';
import { signInAsUnverified } from '../support/session';

test.describe('Verify your email, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function open(page: import('@playwright/test').Page) {
    const verify = new VerifyEmailPage(page);
    await signInAsUnverified(page);
    await page.goto('/verify-email');
    await expect(verify.heading).toBeVisible();
    return verify;
  }

  // The account address is unique per run, so it is hidden from the comparison.
  const compare = (page: import('@playwright/test').Page, name: string) =>
    expect(page).toHaveScreenshot(name, { fullPage: true, mask: [page.locator('.auth-card__lead')] });

  test('default', async ({ page }) => {
    await open(page);
    await compare(page, 'default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page);
    await compare(page, 'default-dark.png');
  });

  test('sent', async ({ page }) => {
    const verify = await open(page);
    await verify.sendAnother.click();
    await expect(verify.sent).toBeVisible();
    await compare(page, 'sent.png');
  });

  test('rate limited', async ({ page }) => {
    const verify = await open(page);
    await page.route('**/api/auth/verification-emails', (route) =>
      route.fulfill({ status: 429, body: '{}' }),
    );
    await verify.sendAnother.click();
    await expect(verify.rateLimited).toBeVisible();
    await compare(page, 'rate-limited.png');
  });

  test('failed', async ({ page }) => {
    const verify = await open(page);
    await page.route('**/api/auth/verification-emails', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await verify.sendAnother.click();
    await expect(verify.failed).toBeVisible();
    await compare(page, 'failed.png');
  });
});
