import { expect, test } from '../fixtures';
import { AddAppDialog } from '../pages/add-app.dialog';
import { DashboardPage } from '../pages/dashboard.page';
import { DirectoryPage } from '../pages/directory.page';
import { EditAppDialog } from '../pages/edit-app.dialog';

test.describe('Add an app from the directory', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  // Acceptance Test
  // Traces to: L2-024
  // Description: Browse directory in the Add app dialog opens the directory, which lists apps by category with name, icon and description.
  test('Browse directory opens a list of apps grouped by category', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const dialog = new AddAppDialog(page);
    const directory = new DirectoryPage(page);
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await dialog.browseDirectory.click();

    await expect(page).toHaveURL(/\/directory$/);
    await expect(directory.heading).toBeVisible();
    expect(await directory.categories()).toEqual(expect.arrayContaining(['Engineering', 'Communication']));
    expect(await directory.categoryOf('Sentry')).toBe('Engineering');
    await expect(directory.entry('Sentry')).toContainText('Errors and performance');
    await expect(directory.entry('Sentry').locator('ig-app-icon')).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-024
  // Description: A search term narrows the list to matching apps, and says so when nothing matches.
  test('search narrows the list and says when nothing matches', async ({ page }) => {
    const directory = new DirectoryPage(page);
    await directory.open();

    await directory.search.fill('sent');
    await expect.poll(() => directory.names()).toEqual(['Sentry']);

    await directory.search.fill('zzzz');
    await expect(directory.noMatches).toBeVisible();
    await expect.poll(() => directory.names()).toEqual([]);

    await directory.search.fill('');
    await expect.poll(async () => (await directory.names()).length).toBeGreaterThan(5);
  });

  // Acceptance Test
  // Traces to: L2-024
  // Description: An app already on the dashboard is listed and marked Added, with no Add button.
  test('apps already on the dashboard are marked Added', async ({ page }) => {
    const directory = new DirectoryPage(page);
    await directory.open();

    await expect(directory.entry('Figma')).toBeVisible();
    await expect(directory.added('Figma')).toBeVisible();
    await expect(directory.addButton('Figma')).toHaveCount(0);
    await expect(directory.added('Sentry')).toHaveCount(0);
    await expect(directory.addButton('Sentry')).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-025, L2-009
  // Description: Add opens the form with name, address, description and category filled in, and saving creates the tile at the first free 3 by 2 space.
  test('Add pre-fills the form and the saved tile takes the first free space', async ({ page }) => {
    const directory = new DirectoryPage(page);
    const dialog = new AddAppDialog(page);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const expected = await dashboard.grid.firstFreeCell();
    await page.goto('/directory');

    await directory.addFromCatalog('Stripe');

    await expect(dialog.name).toHaveValue('Stripe');
    await expect(dialog.address).toHaveValue('https://dashboard.stripe.com');
    await expect(dialog.description).not.toBeEmpty();
    await expect(dialog.category).toHaveValue('Finance');
    await dialog.submit.click();
    await expect(dashboard.shell.toast('App added')).toBeVisible();

    await page.goto('/');
    await expect(dashboard.tile('Stripe')).toBeVisible();
    expect(await dashboard.grid.placement('Stripe')).toEqual({ ...expected, cols: 3, rows: 2 });

    await dashboard.enterEditLayout();
    await dashboard.editApp('Stripe');
    await new EditAppDialog(page).deleteApp();
  });
});
