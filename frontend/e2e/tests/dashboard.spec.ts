import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard', () => {
  test('greets the signed-in person and says how many apps they have', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.heading).toHaveText('Good afternoon, Maya');
    await expect(dashboard.summary).toHaveText(/^\d+ apps/);
  });

  test('the header has the brand, search with its "/" hint, Edit layout, Add app and the avatar', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.shell.brand).toBeVisible();
    await expect(dashboard.shell.brandMark).toBeVisible();
    await expect(dashboard.shell.search).toHaveAttribute('placeholder', 'Jump to an app');
    await expect(dashboard.shell.searchHint).toHaveText('/');
    await expect(dashboard.shell.editLayout).toBeVisible();
    await expect(dashboard.shell.addApp).toBeVisible();
    await expect(dashboard.shell.avatar).toHaveText('MO');
  });

  test('the first row holds three large tiles and the rest are compact', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.largeTiles()).toHaveCount(3);
    expect(await dashboard.smallTiles().count()).toBeGreaterThan(0);
    await expect(dashboard.tiles.first().locator('.tile--large')).toHaveCount(1);
    await expect(dashboard.largeTiles().first()).toContainText('Open');
    await expect(dashboard.largeTiles().first()).toContainText(/Opened|Not opened yet/);
  });

  test('a tile opens its app in a new tab and records that it was opened', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    const [first] = await dashboard.tileNames();

    const popup = await dashboard.openApp(first);

    expect(popup.url()).not.toBe('about:blank');
    await expect(dashboard.tile(first)).toContainText('Opened just now');
  });

  test('pressing "/" focuses the search, and typing narrows the tiles', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    const names = await dashboard.tileNames();

    await dashboard.shell.pressSlash();
    await expect(dashboard.shell.search).toBeFocused();
    await dashboard.shell.typeInSearch(names[0]);

    await expect(dashboard.tiles).toHaveCount(1);
    await expect(dashboard.tile(names[0])).toBeVisible();
  });

  test('a search with no match says so and can be cleared', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    const total = await dashboard.tiles.count();

    await dashboard.shell.typeInSearch('zzzz-no-such-app');
    await expect(dashboard.noMatches).toBeVisible();
    await dashboard.clearSearch.click();

    await expect(dashboard.tiles).toHaveCount(total);
    await expect(dashboard.shell.search).toHaveValue('');
  });

  test('the footer says apps open in a new tab and links to the brand guide', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await expect(dashboard.shell.footerNote).toHaveText(
      'Apps open in a new tab. ingresso never sees what you do inside them.',
    );
    await expect(dashboard.shell.brandGuide).toBeVisible();
  });
});
