import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { VerifyEmailPage } from '../pages/verify-email.page';
import { signInAsUnverified } from '../support/session';

test.describe('Verify an email address', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-029
  // Description: An unverified account opening the dashboard is sent to a screen that explains why, and never sees an error.
  test('an unverified account is sent to the verify-email screen', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const email = await signInAsUnverified(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/verify-email/);
    await expect(verify.heading).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(verify.sendAnother).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-029
  // Description: Send another email delivers a verification link, and following it opens the dashboard.
  test('sending another email and following its link opens the dashboard', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    const dashboard = new DashboardPage(page);
    const email = await signInAsUnverified(page);
    await page.goto('/verify-email');

    await verify.sendAnother.click();
    await expect(verify.sent).toBeVisible();
    await page.goto(await verify.linkFromMailbox(email));

    await expect(page).toHaveURL(/\/$/);
    await expect(dashboard.shell.toast('Email verified')).toBeVisible();
    await expect(dashboard.emptyTitle).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-029
  // Description: While the email is on its way the button says so, and being rate limited or failing is explained.
  test('sending shows progress, and a rate limit or failure is explained', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    await signInAsUnverified(page);
    await page.goto('/verify-email');
    let status = 429;
    await page.route('**/api/auth/verification-emails', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({ status, contentType: 'application/problem+json', body: '{}' });
    });

    await verify.sendAnother.click();
    await expect(verify.sending).toBeDisabled();
    await expect(verify.rateLimited).toBeVisible();

    status = 500;
    await verify.sendAnother.click();
    await expect(verify.failed).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-029
  // Description: A verification link that does not work lands on the same screen and says so.
  test('a verification link that did not work says so', async ({ page }) => {
    const verify = new VerifyEmailPage(page);
    await signInAsUnverified(page);

    await page.goto('/auth/verify-email?token=not-a-real-token');

    await expect(page).toHaveURL(/\/verify-email/);
    await expect(verify.linkInvalid).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-029
  // Description: A verified account has no reason to be on the screen and is sent to its dashboard.
  test('a verified account is sent on to the dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await page.goto('/verify-email');

    await expect(page).toHaveURL(/\/$/);
    await expect(dashboard.tiles.first()).toBeVisible();
  });
});
