import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { signInAsNewPerson } from '../support/session';

test.describe('Greet by profile name', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-146
  // Description: A person with a display name sees "Hi, {display name}" with the whole name, and no Add your name.
  test('a person with a display name is greeted by it', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.heading).toHaveText('Hi, Maya Okafor');
    await expect(dashboard.addYourName).toBeHidden();
  });

  // Acceptance Test
  // Traces to: L2-146
  // Description: A person without a display name sees "Hi there" and Add your name, and never their email address.
  test('a person without a display name is greeted without their email', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const email = await signInAsNewPerson(page);
    await dashboard.openSignedIn();

    await expect(dashboard.heading).toHaveText('Hi there');
    await expect(dashboard.heading).not.toContainText(email);
    await expect(dashboard.addYourName).toBeVisible();
  });
});
