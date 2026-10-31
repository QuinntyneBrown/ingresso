import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { EditAppDialog } from '../pages/edit-app.dialog';

const unique = () => `Temp ${Date.now().toString(36)}`;

/** Adds a tile of its own so the edit and delete tests never touch the seeded apps. */
async function addTile(dashboard: DashboardPage, page: import('@playwright/test').Page, name: string) {
  await dashboard.shell.addApp.click();
  await new AddAppDialog(page).add({ name, url: 'https://temp.example.com' });
  await expect(dashboard.tile(name)).toBeVisible();
}

test.describe('Edit and delete an app', () => {
  test('in edit-layout mode a tile has an Edit button that opens the edit dialog with its details', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addTile(dashboard, page, name);

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);

    await expect(edit.dialog).toBeVisible();
    await expect(edit.name).toHaveValue(name);
    await expect(edit.address).toHaveValue(/^https:\/\/temp\.example\.com\/?$/);
    await edit.deleteApp();
  });

  test('saving a new name updates the tile', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    const renamed = `${name} renamed`;
    await dashboard.open();
    await addTile(dashboard, page, name);

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.rename(renamed);

    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.shell.toast('Changes saved')).toBeVisible();
    await expect(dashboard.tile(renamed)).toBeVisible();
    await expect(dashboard.tile(name)).toHaveCount(0);

    await dashboard.editApp(renamed);
    await edit.deleteApp();
  });

  test('delete asks first, and keeping the app leaves it in place', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addTile(dashboard, page, name);

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.delete.click();
    await expect(edit.confirmation).toContainText(`Delete ${name}?`);
    await edit.keep.click();
    await expect(edit.save).toBeVisible();
    await edit.cancel.click();

    await expect(dashboard.tile(name)).toBeVisible();
    await dashboard.editApp(name);
    await edit.deleteApp();
  });

  test('deleting an app removes its tile', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addTile(dashboard, page, name);
    const withTile = await dashboard.tiles.count();

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await edit.deleteApp();

    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.shell.toast('App deleted')).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(withTile - 1);
    await expect(dashboard.tile(name)).toHaveCount(0);
  });
});
