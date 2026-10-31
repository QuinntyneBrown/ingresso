import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { AddAppDialog } from '../pages/add-app.dialog';
import { failTiles, slowTiles, stubTiles } from '../support/stub-api';

// States the seed data does not hold: nothing yet, still loading, and a failed load.
test.describe('Dashboard states', () => {
  // Acceptance Test
  // Traces to: L2-010
  // Description: With no tiles the dashboard explains itself and offers Add an app, which opens the Add app dialog.
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

  // Acceptance Test
  // Traces to: L2-011
  // Description: While tiles load, skeleton tiles are shown and exposed as busy; then the tiles replace them.
  test('a slow load announces itself politely and then shows the tiles', async ({ page }) => {
    await slowTiles(page, 800);
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.busyGrid).toBeAttached();
    await expect(dashboard.summary).toHaveText('Loading your apps…');
    await expect(page.getByRole('status').filter({ hasText: 'Loading apps' })).toBeAttached();
    await expect(dashboard.tiles.first()).toBeVisible();
    await expect(dashboard.busyGrid).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-011
  // Description: A failed load shows an alert with Try again, and Try again replaces it with the tiles.
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
