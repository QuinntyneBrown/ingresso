import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { EditAppDialog } from '../pages/edit-app.dialog';

const unique = () => `Doomed ${Date.now().toString(36)}`;

async function addTile(dashboard: DashboardPage, page: import('@playwright/test').Page, name: string) {
  await dashboard.shell.addApp.click();
  await new AddAppDialog(page).add({
    name,
    url: `https://${name.toLowerCase().replace(/\s/g, '-')}.example.com`,
  });
  await expect(dashboard.tile(name)).toBeVisible();
}

test.describe('Delete a tile', () => {
  // Acceptance Test
  // Traces to: L2-007
  // Description: Delete asks first and names the tile; keeping the app closes the question and changes nothing.
  test('delete asks first, and keeping the app leaves it in place', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await addTile(dashboard, page, name);
    const before = await dashboard.grid.layout();

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.delete.click();
    await expect(edit.confirmation).toContainText(`Delete ${name}?`);
    await edit.keep.click();
    await expect(edit.save).toBeVisible();
    await edit.cancel.click();

    await expect(dashboard.tile(name)).toBeVisible();
    expect(await dashboard.grid.layout()).toEqual(before);

    await dashboard.removeApp(name);
  });

  // Acceptance Test
  // Traces to: L2-007
  // Description: Confirming deletes the tile, shows a toast, and every other tile keeps its position and span.
  test('deleting an app removes only its tile and a toast confirms', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await addTile(dashboard, page, name);
    const others = (await dashboard.grid.layout()).filter((t) => t.name !== name);

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.deleteApp();

    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.shell.toast('App deleted')).toBeVisible();
    await expect(dashboard.tile(name)).toHaveCount(0);
    expect(await dashboard.grid.layout()).toEqual(others);

    await page.reload();
    await expect(dashboard.tiles.first()).toBeVisible();
    expect(await dashboard.grid.layout()).toEqual(others);
  });

  // Acceptance Test
  // Traces to: L2-007
  // Description: If the delete request fails, the tile stays and the dialog says so.
  test('a failed delete keeps the tile and says so', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await addTile(dashboard, page, name);
    await page.route('**/api/tiles/*', (route) =>
      route.request().method() === 'DELETE' ? route.fulfill({ status: 500, body: '{}' }) : route.fallback(),
    );

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.deleteApp();

    await expect(edit.dialog).toBeVisible();
    await expect(edit.dialog.getByRole('alert')).toContainText(new RegExp(`couldn.t delete ${name}`));
    await expect(edit.dialog.getByRole('alert')).toContainText('Nothing was removed');
    await page.unroute('**/api/tiles/*');
    await edit.cancel.click();
    await expect(dashboard.tile(name)).toBeVisible();

    await dashboard.removeApp(name);
  });
});
