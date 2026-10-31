import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { DirectoryPage } from '../pages/directory.page';
import { EditAppDialog } from '../pages/edit-app.dialog';

const unique = () => `Acme ${Date.now().toString(36)}`;

test.describe('Add an app', () => {
  test('Add app opens a dialog and the new tile appears on the dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    const name = unique();
    await dashboard.open();
    const before = await dashboard.tiles.count();

    await dashboard.shell.addApp.click();
    await dialog.add({ name, url: 'https://acme.example.com', color: 'Teal', size: 'Compact' });

    await expect(dialog.dialog).toBeHidden();
    await expect(dashboard.shell.toast('App added')).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(before + 1);
    await expect(dashboard.tile(name)).toContainText('acme.example.com');
    await expect(dashboard.tile(name).locator('ig-app-icon')).toHaveText(/^A/);
  });

  test('the dialog asks for a name and an address before it saves', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    await dashboard.open();
    const before = await dashboard.tiles.count();

    await dashboard.shell.addApp.click();
    await dialog.submit.click();

    await expect(dialog.nameError).toHaveText('Enter a name for the app.');
    await expect(dialog.addressError).toHaveText('Enter a web address for the app.');
    await expect(dialog.dialog).toBeVisible();
    await dialog.cancel.click();
    await expect(dashboard.tiles).toHaveCount(before);
  });

  test('initials follow the name until they are edited', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await dialog.name.fill('Northwind Reports');

    await expect(dialog.initials).toHaveValue('NR');
  });

  test('the directory lists common apps and adds one with its details filled in', async ({ page }) => {
    const directory = new DirectoryPage(page);
    const dialog = new AddAppDialog(page);
    const dashboard = new DashboardPage(page);
    await directory.open();

    await expect(directory.heading).toBeVisible();
    await directory.addFromCatalog('Figma');

    await expect(dialog.name).toHaveValue('Figma');
    await expect(dialog.address).toHaveValue('https://www.figma.com');
    await dialog.submit.click();
    await expect(dashboard.shell.toast('App added')).toBeVisible();

    // Clean up so the run leaves the dashboard as it found it.
    await page.goto('/');
    await dashboard.enterEditLayout();
    await dashboard.editApp('Figma');
    await new EditAppDialog(page).deleteApp();
  });

  test('the directory adds an app from any address', async ({ page }) => {
    const directory = new DirectoryPage(page);
    const dialog = new AddAppDialog(page);
    await directory.open();

    await directory.customUrl.click();

    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.name).toBeEmpty();
  });
});
