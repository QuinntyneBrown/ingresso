// Acceptance Test
// Traces to: L2-019
// Description: The reset confirmation, its busy state and its failure look as designed in docs/mocks/dialogs/reset-layout.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Reset layout confirmation, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function ask(page: import('@playwright/test').Page) {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await dashboard.enterEditLayout();
    await dashboard.resetLayout.click();
    await expect(dashboard.resetDialog).toBeVisible();
    return dashboard;
  }

  test('default', async ({ page }) => {
    const dashboard = await ask(page);
    await expect(dashboard.resetDialog).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dashboard = await ask(page);
    await expect(dashboard.resetDialog).toHaveScreenshot('default-dark.png');
  });

  test('busy', async ({ page }) => {
    await page.route('**/api/tiles/reset-layout', () => new Promise(() => undefined));
    const dashboard = await ask(page);
    await dashboard.confirmReset.click();
    await expect(dashboard.confirmReset).toHaveAttribute('aria-busy', 'true');
    await expect(dashboard.resetDialog).toHaveScreenshot('busy.png');
  });

  test('failed', async ({ page }) => {
    await page.route('**/api/tiles/reset-layout', (route) => route.fulfill({ status: 500, body: '{}' }));
    const dashboard = await ask(page);
    await dashboard.confirmReset.click();
    await expect(dashboard.resetDialog.getByRole('alert')).toBeVisible();
    await expect(dashboard.resetDialog).toHaveScreenshot('failed.png');
  });
});
