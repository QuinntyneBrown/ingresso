// Acceptance Test
// Traces to: L2-002, L2-026
// Description: Each Add app dialog state looks as designed in docs/mocks/dialogs/add-app, in light and dark.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';

test.describe('Add app dialog, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function open(page: import('@playwright/test').Page) {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await dashboard.shell.addApp.click();
    return new AddAppDialog(page);
  }

  test('default', async ({ page }) => {
    const dialog = await open(page);
    await expect(dialog.dialog).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dialog = await open(page);
    await expect(dialog.dialog).toHaveScreenshot('default-dark.png');
  });

  test('invalid', async ({ page }) => {
    const dialog = await open(page);
    await dialog.submit.click();
    await expect(dialog.nameError).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('invalid.png');
  });

  test('duplicate address', async ({ page }) => {
    const dialog = await open(page);
    await dialog.add({ name: 'Mail again', url: 'https://mail.google.com' });
    await expect(dialog.duplicateWarning).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('duplicate.png');
  });

  test('failed', async ({ page }) => {
    await page.route('**/api/tiles', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' })
        : route.fallback(),
    );
    const dialog = await open(page);
    await dialog.add({ name: 'Unlucky', url: 'https://unlucky.example.com' });
    await expect(dialog.dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('failed.png');
  });
});
