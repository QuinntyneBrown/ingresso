import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { SignInPage } from '../pages/sign-in.page';
import { SignOutDialog } from '../pages/sign-out.dialog';

test.describe('Sign out', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-031
  // Description: Choosing Sign out from the account menu and confirming ends the session and lands on the sign-in screen.
  test('the account menu signs the person out and returns to sign-in', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new SignOutDialog(page);
    const signIn = new SignInPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.signedInAs).toContainText('@');
    await dialog.signOut.click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(signIn.heading).toBeVisible();
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(401);
  });

  // Acceptance Test
  // Traces to: L2-031
  // Description: Choosing Stay signed in closes the dialog and keeps the session.
  test('Stay signed in keeps the session', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new SignOutDialog(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await dialog.stay.click();

    await expect(dialog.dialog).toBeHidden();
    await expect(page).not.toHaveURL(/sign-in/);
    expect((await page.request.get('/api/auth/me')).status()).toBe(200);
    await expect(dashboard.shell.accountMenu).toBeFocused();
  });

  // Acceptance Test
  // Traces to: L2-031
  // Description: While signing out the dialog shows it is busy, and a failure keeps the person signed in and says so.
  test('a failed sign-out says so and keeps the person signed in', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new SignOutDialog(page);
    await page.route('**/api/auth/sign-out', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' });
    });
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await dialog.signOut.click();

    await expect(dialog.signingOut).toBeDisabled();
    await expect(dialog.failed).toContainText("We couldn't sign you out");
    await expect(dialog.signOut).toBeEnabled();
    await expect(page).not.toHaveURL(/sign-in/);
  });
});
