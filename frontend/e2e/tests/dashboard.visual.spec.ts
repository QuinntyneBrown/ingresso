// Acceptance Test
// Traces to: L2-008, L2-010, L2-011, L2-042
// Description: Each dashboard state and width looks as designed in docs/mocks/pages/dashboard.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { DEFAULT_TILES, failTiles, slowTiles, stubTiles } from '../support/stub-api';

test.describe('Dashboard, visually', () => {
  async function show(page: import('@playwright/test').Page, width = 1280, height = 900) {
    await stubTiles(page, DEFAULT_TILES);
    await page.setViewportSize({ width, height });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    return dashboard;
  }

  test('desktop', async ({ page }) => {
    await show(page);
    await expect(page).toHaveScreenshot('desktop.png');
  });

  test('desktop in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await show(page);
    await expect(page).toHaveScreenshot('desktop-dark.png');
  });

  test('tablet', async ({ page }) => {
    await show(page, 900, 1000);
    await expect(page).toHaveScreenshot('tablet.png');
  });

  test('phone', async ({ page }) => {
    await show(page, 390, 800);
    await expect(page).toHaveScreenshot('phone.png');
  });

  test('loading', async ({ page }) => {
    await slowTiles(page, 20_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.busyGrid).toBeAttached();
    await expect(page).toHaveScreenshot('loading.png');
  });

  test('empty', async ({ page }) => {
    await stubTiles(page, []);
    await page.setViewportSize({ width: 1280, height: 900 });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.emptyTitle).toBeVisible();
    await expect(page).toHaveScreenshot('empty.png');
  });

  test('error', async ({ page }) => {
    await failTiles(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.loadFailed).toBeVisible();
    await expect(page).toHaveScreenshot('error.png');
  });
});
