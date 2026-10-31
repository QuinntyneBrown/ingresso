import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { EditAppDialog } from '../pages/edit-app.dialog';

const unique = () => `Temp ${Date.now().toString(36)}`;

/** Adds a tile of its own so the edit and delete tests never touch the seeded apps. */
async function addTile(dashboard: DashboardPage, page: import('@playwright/test').Page, name: string) {
  await dashboard.shell.addApp.click();
  await new AddAppDialog(page).add({
    name,
    url: `https://${name.toLowerCase().replace(/\s/g, '-')}.example.com`,
  });
  await expect(dashboard.tile(name)).toBeVisible();
}

/** Adds a tile with every field filled in, so edit has real values to show. */
async function addDetailedTile(
  dashboard: DashboardPage,
  page: import('@playwright/test').Page,
  name: string,
) {
  await dashboard.shell.addApp.click();
  await new AddAppDialog(page).add({
    name,
    url: `https://${name.toLowerCase().replace(/\s/g, '-')}.example.com/app`,
    description: 'Team billing',
    category: 'Finance',
    color: 'Teal',
  });
  await expect(dashboard.tile(name)).toBeVisible();
}

test.describe('Edit a tile', () => {
  // Acceptance Test
  // Traces to: L2-006
  // Description: Edit opens with the tile's current name, address, description, category and colour.
  test('edit opens with the current values', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addDetailedTile(dashboard, page, name);

    await dashboard.enterEditLayout();
    await dashboard.editApp(name);

    await expect(edit.name).toHaveValue(name);
    await expect(edit.address).toHaveValue(
      `https://${name.toLowerCase().replace(/\s/g, '-')}.example.com/app`,
    );
    await expect(edit.description).toHaveValue('Team billing');
    await expect(edit.category).toHaveValue('Finance');
    await expect(edit.colour('Teal')).toBeChecked();
    await edit.deleteApp();
  });

  // Acceptance Test
  // Traces to: L2-006, L2-003
  // Description: Saving valid changes updates the tile in place, keeps its position and span, stores the address unchanged and confirms with a toast.
  test('saving changes updates the tile in place', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addDetailedTile(dashboard, page, name);
    await dashboard.enterEditLayout();
    const before = await dashboard.grid.placement(name);

    await dashboard.editApp(name);
    await edit.name.fill(`${name} v2`);
    await edit.address.fill('https://changed.example.com/path/');
    await edit.colour('Pink').check();
    await edit.save.click();

    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.shell.toast('Changes saved')).toBeVisible();
    await expect(dashboard.tile(`${name} v2`)).toContainText('changed.example.com');
    expect(await dashboard.grid.placement(`${name} v2`)).toEqual(before);

    await dashboard.editApp(`${name} v2`);
    await expect(edit.address).toHaveValue('https://changed.example.com/path/');
    await edit.deleteApp();
  });

  // Acceptance Test
  // Traces to: L2-006, L2-002, L2-003
  // Description: Invalid changes keep the dialog open with linked field errors, and nothing is stored.
  test('invalid changes keep the dialog open and store nothing', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addDetailedTile(dashboard, page, name);
    await dashboard.enterEditLayout();

    await dashboard.editApp(name);
    await edit.name.fill('');
    await edit.address.fill('https://');
    await edit.save.click();

    await expect(edit.dialog).toBeVisible();
    await expect(edit.nameError).toBeVisible();
    await expect(edit.name).toBeFocused();
    await expect(edit.name).toHaveAttribute('aria-describedby', /app-name-error/);
    await edit.cancel.click();
    await expect(dashboard.tile(name)).toContainText('.example.com');

    await dashboard.editApp(name);
    await edit.address.fill('https://');
    await edit.save.click();
    await expect(edit.addressError).toBeVisible();
    await expect(edit.dialog).toBeVisible();
    await edit.cancel.click();
    await dashboard.editApp(name);
    await expect(edit.address).toHaveValue(/\.example\.com\/app$/);
    await edit.deleteApp();
  });

  // Acceptance Test
  // Traces to: L2-006
  // Description: Cancel and Escape change nothing and return focus to the Edit button that opened the dialog.
  test('cancel and Escape change nothing and return focus to Edit', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    const name = unique();
    await dashboard.open();
    await addDetailedTile(dashboard, page, name);
    await dashboard.enterEditLayout();

    await dashboard.editApp(name);
    await edit.name.fill('Never saved');
    await edit.cancel.click();
    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.editButton(name)).toBeFocused();

    await dashboard.editApp(name);
    await edit.name.fill('Never saved either');
    await page.keyboard.press('Escape');
    await expect(edit.dialog).toBeHidden();
    await expect(dashboard.editButton(name)).toBeFocused();
    await expect(dashboard.tile(name)).toBeVisible();

    await dashboard.editApp(name);
    await edit.deleteApp();
  });
});

test.describe('Failed saves on a short screen', () => {
  // Acceptance Test
  // Traces to: L2-006
  // Description: When saving fails on a short screen, the error alert is scrolled into view so the person sees why nothing changed.
  test('the failure alert is brought into view', async ({ page }) => {
    await page.route('**/api/tiles/*', (route) =>
      route.request().method() === 'PUT'
        ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' })
        : route.fallback(),
    );
    const dashboard = new DashboardPage(page);
    const edit = new EditAppDialog(page);
    await page.setViewportSize({ width: 1280, height: 480 });
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await dashboard.enterEditLayout();
    await dashboard.editApp('Gmail');
    await edit.category.scrollIntoViewIfNeeded();

    await edit.save.click();

    await expect(edit.confirmation).toBeVisible();
    await expect(edit.confirmation).toBeInViewport({ ratio: 1 });
  });
});

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
    await expect(edit.address).toHaveValue(/^https:\/\/temp-[a-z0-9]+\.example\.com$/);
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
