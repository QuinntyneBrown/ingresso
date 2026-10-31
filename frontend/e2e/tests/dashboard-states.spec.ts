import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { failTiles, slowTiles, stubTiles } from '../support/stub-api';

// States the seed data does not hold: nothing yet, still loading, and a failed load.
test.describe('Dashboard states', () => {
  test('with no apps it invites the person to add their first one', async ({ page }) => {
    await stubTiles(page, []);
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.emptyTitle).toBeVisible();
    await expect(dashboard.summary).toHaveText(/^0 apps/);
    await expect(dashboard.shell.editLayout).toBeDisabled();

    await dashboard.addFirstApp.click();
    await expect(new AddAppDialog(page).dialog).toBeVisible();
  });

  test('a slow load announces itself politely and then shows the tiles', async ({ page }) => {
    await slowTiles(page, 800);
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(page.getByRole('status').filter({ hasText: 'Loading apps' })).toBeAttached();
    await expect(dashboard.tiles.first()).toBeVisible();
  });

  test('a failed load says so and Try again recovers', async ({ page }) => {
    const restore = await failTiles(page);
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.loadFailed).toBeVisible();
    await restore();
    await dashboard.tryAgain.click();

    await expect(dashboard.tiles.first()).toBeVisible();
  });
});
