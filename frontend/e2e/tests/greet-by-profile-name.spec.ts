import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Greet by profile name', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-146
  // Description: A person with a display name sees "Hi, {display name}" with the whole name, and no Add your name.
  test('a person with a display name is greeted by it', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.heading).toHaveText('Hi, Maya Okafor');
  });
});
