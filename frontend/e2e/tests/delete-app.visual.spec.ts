// Acceptance Test
// Traces to: L2-007
// Description: The delete confirmation and its failure look as designed in docs/mocks/dialogs/delete-app.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { EditAppDialog } from '../pages/edit-app.dialog';

test.describe('Delete confirmation, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function ask(page: import('@playwright/test').Page) {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await dashboard.enterEditLayout();
    await dashboard.editApp('Gmail');
    const edit = new EditAppDialog(page);
    await edit.delete.click();
    await expect(edit.confirmation).toContainText('Delete Gmail?');
    return edit;
  }

  test('default', async ({ page }) => {
    const edit = await ask(page);
    await expect(edit.dialog).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const edit = await ask(page);
    await expect(edit.dialog).toHaveScreenshot('default-dark.png');
  });

  test('failed', async ({ page }) => {
    await page.route('**/api/tiles/*', (route) =>
      route.request().method() === 'DELETE' ? route.fulfill({ status: 500, body: '{}' }) : route.fallback(),
    );
    const edit = await ask(page);
    await edit.confirmDelete.click();
    await expect(edit.dialog.getByRole('alert').filter({ hasText: /couldn.t delete/i })).toBeVisible();
    await expect(edit.dialog).toHaveScreenshot('failed.png');
  });
});
