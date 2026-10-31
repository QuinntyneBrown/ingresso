import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { SignInPage } from '../pages/sign-in.page';

test.describe('Sign in with an email link', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API to issue and redeem links.');

  const newEmail = () =>
    `person-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`;

  // Acceptance Test
  // Traces to: L2-027
  // Description: The sign-in page asks only for an email address and offers to email a link.
  test('the page asks for an email address and nothing else', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await expect(signIn.heading).toHaveText('Sign in to ingresso');
    await expect(signIn.email).toBeVisible();
    await expect(signIn.emailMeALink).toBeVisible();
    await expect(page.getByLabel('Password')).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-027
  // Description: A malformed email is refused on the page with an error summary and an inline error.
  test('a malformed email shows what to fix and sends nothing', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.requestLink('maya@northwind');

    await expect(signIn.errorSummary).toContainText('Enter a valid email address');
    await expect(signIn.emailError).toHaveText('Enter a valid email address, like maya@northwind.com');
    await expect(signIn.email).toHaveAttribute('aria-invalid', 'true');
    await expect(signIn.heading).toHaveText('Sign in to ingresso');
  });

  // Acceptance Test
  // Traces to: L2-027, L2-028, L2-030
  // Description: Asking for a link shows check-your-inbox; opening the emailed link signs the person in on their own dashboard.
  test('the emailed link signs the person in', async ({ page }) => {
    const signIn = new SignInPage(page);
    const dashboard = new DashboardPage(page);
    const email = newEmail();
    await signIn.open();

    await signIn.requestLink(email);

    await expect(signIn.heading).toHaveText('Check your inbox');
    await expect(signIn.sentMessage).toContainText(email);
    await expect(signIn.sentMessage).toContainText('15 minutes');
    await signIn.followLink(await signIn.linkFromMailbox(email));
    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.heading).toContainText('Good afternoon');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  // Acceptance Test
  // Traces to: L2-028
  // Description: A link that was already used is refused with a clear message and starts no session.
  test('a used link says it was already used and signs nobody in', async ({ page }) => {
    const signIn = new SignInPage(page);
    const email = newEmail();
    await signIn.open();
    await signIn.requestLink(email);
    const link = await signIn.linkFromMailbox(email);
    await signIn.followLink(link);
    await page.context().clearCookies();

    await signIn.followLink(link);

    await signIn.waitUntilShown();
    await expect(signIn.notice).toContainText('That link was already used');
    await expect(signIn.email).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-028
  // Description: A tampered link says only that it did not work, and the person can ask for a new one.
  test('a tampered link says it did not work without saying why', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.followLink('/auth/redeem?token=not-a-real-token');

    await signIn.waitUntilShown();
    await expect(signIn.notice).toContainText('That link didn’t work');
    await expect(signIn.notice).not.toContainText(/expired|used/i);
    await expect(signIn.emailMeALink).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-028
  // Description: An expired link says so and offers a new one.
  test('an expired link says it expired and offers a new one', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open('expired');

    await expect(signIn.notice).toContainText('That link has expired');
    await expect(signIn.notice).toContainText('15 minutes');
    await expect(signIn.emailMeALink).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-027
  // Description: Too many link requests is shown as a calm wait-and-retry message.
  test('too many requests says to wait and keeps the email', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.answerLinkRequestsWith(429);
    await signIn.open();

    await signIn.requestLink('maya@northwind.com');

    await expect(signIn.notice).toContainText('Too many requests');
    await expect(signIn.email).toHaveValue('maya@northwind.com');
  });

  // Acceptance Test
  // Traces to: L2-027
  // Description: A failed request says so without losing what the person typed.
  test('a server failure offers to try again and keeps the email', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.answerLinkRequestsWith(500);
    await signIn.open();

    await signIn.requestLink('maya@northwind.com');

    await expect(signIn.notice).toContainText('We couldn’t send the link');
    await expect(signIn.email).toHaveValue('maya@northwind.com');
  });

  // Acceptance Test
  // Traces to: L2-027
  // Description: From check-your-inbox the person can go back and use a different address.
  test('use a different email returns to the form', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.requestLink(newEmail());

    await signIn.useDifferentEmail.click();

    await expect(signIn.heading).toHaveText('Sign in to ingresso');
    await expect(signIn.email).toHaveValue('');
  });
});
