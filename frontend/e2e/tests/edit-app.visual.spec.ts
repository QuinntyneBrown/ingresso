// Acceptance Test
// Traces to: L2-006
// Description: Each Edit app dialog state looks as designed in docs/mocks/dialogs/edit-app.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { EditAppDialog } from '../pages/edit-app.dialog';

test.describe('Edit app dialog, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function open(page: import('@playwright/test').Page) {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await dashboard.enterEditLayout();
    await dashboard.editApp('Gmail');
    return new EditAppDialog(page);
  }

  test('default', async ({ page }) => {
    const edit = await open(page);
    await expect(edit.dialog).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const edit = await open(page);
    await expect(edit.dialog).toHaveScreenshot('default-dark.png');
  });

  test('invalid', async ({ page }) => {
    const edit = await open(page);
    await edit.name.fill('');
    await edit.save.click();
    await expect(edit.nameError).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('invalid.png');
  });

  test('failed', async ({ page }) => {
    await page.route('**/api/tiles/*', (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' })
        : route.fallback(),
    );
    const edit = await open(page);
    await edit.save.click();
    await expect(edit.dialog.getByRole('alert')).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('failed.png');
  });
});
