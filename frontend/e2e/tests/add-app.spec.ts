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
    await expect(dashboard.tiles.first()).toBeVisible();
    const before = await dashboard.tiles.count();

    await dashboard.shell.addApp.click();
    await dialog.add({
      name,
      url: `https://${name.toLowerCase().replace(/\s/g, '-')}.example.com`,
      color: 'Teal',
    });

    await expect(dialog.dialog).toBeHidden();
    await expect(dashboard.shell.toast('App added')).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(before + 1);
    await expect(dashboard.tile(name)).toContainText('.example.com');
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

  // Acceptance Test
  // Traces to: L2-002
  // Description: Submitting an invalid form moves focus to the first invalid field, and its error is linked with aria-describedby.
  test('invalid fields are linked to their errors and focus lands on the first one', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await dialog.submit.click();

    await expect(dialog.name).toBeFocused();
    await expect(dialog.name).toHaveAttribute('aria-describedby', /app-name-error/);
    await expect(dialog.address).toHaveAttribute('aria-describedby', /app-url-error/);
  });

  // Acceptance Test
  // Traces to: L2-026
  // Description: An address already on the dashboard raises a warning that lets the user continue or cancel.
  test('adding an address twice warns and lets the person continue or cancel', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    const name = unique();
    const url = `https://${name.replace(/\s/g, '-').toLowerCase()}.example.com`;
    await dashboard.open();
    await dashboard.shell.addApp.click();
    await dialog.add({ name, url });
    await expect(dashboard.tile(name)).toBeVisible();
    const before = await dashboard.tiles.count();

    await dashboard.shell.addApp.click();
    await dialog.add({ name: `${name} again`, url });
    await expect(dialog.duplicateWarning).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(before);
    await dialog.cancel.click();
    await expect(dialog.dialog).toBeHidden();
    await expect(dashboard.tiles).toHaveCount(before);

    await dashboard.shell.addApp.click();
    await dialog.add({ name: `${name} again`, url });
    await dialog.addAnyway.click();
    await expect(dialog.dialog).toBeHidden();
    await expect(dashboard.tiles).toHaveCount(before + 1);
  });

  // Acceptance Test
  // Traces to: L2-037
  // Description: A name containing markup is shown as plain text, never as HTML.
  test('tile text renders as text, not markup', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    const name = '<b>Bold</b> & <i>co</i>';
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await dialog.add({ name, url: 'https://markup.example.com', description: '<script>alert(1)</script>' });

    await expect(dashboard.tile(name)).toBeVisible();
    await expect(dashboard.tile(name).locator('b')).toHaveCount(0);
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
    await directory.addFromCatalog('Sentry');

    await expect(dialog.name).toHaveValue('Sentry');
    await expect(dialog.address).toHaveValue('https://sentry.io');
    await dialog.submit.click();
    await expect(dashboard.shell.toast('App added')).toBeVisible();

    // Clean up so the run leaves the dashboard as it found it.
    await page.goto('/');
    await dashboard.enterEditLayout();
    await dashboard.editApp('Sentry');
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
