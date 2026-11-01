// Acceptance Test
// Traces to: L2-146
// Description: The greeting looks as designed in docs/mocks/pages/dashboard (default, name-unset, name-long, edit-profile).
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { EditProfileDialog } from '../pages/edit-profile.dialog';
import { DEFAULT_TILES, stubTiles } from '../support/stub-api';

const LONG_NAME =
  'Maya Alessandra Okonkwo-Reyes de la Fuente Villanueva Castellanos Montgomery-Hargreaves Whitfield Li';

test.describe('Greet by profile name, visually', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');

  async function show(
    page: Page,
    displayName: string | null,
    width = 1280,
    height = 900,
  ): Promise<DashboardPage> {
    await stubTiles(page, DEFAULT_TILES);
    await page.setViewportSize({ width, height });
    const dashboard = new DashboardPage(page);
    await dashboard.showMockDisplayName(displayName);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    await expect(dashboard.heading).toHaveText(displayName ? `Hi, ${displayName}` : 'Hi there');
    return dashboard;
  }

  test('name unset', async ({ page }) => {
    await show(page, null);
    await expect(page).toHaveScreenshot('name-unset.png');
  });

  test('name unset in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await show(page, null);
    await expect(page).toHaveScreenshot('name-unset-dark.png');
  });

  test('name unset on a phone', async ({ page }) => {
    await show(page, null, 390, 800);
    await expect(page).toHaveScreenshot('name-unset-phone.png');
  });

  test('a long name on a phone', async ({ page }) => {
    await show(page, LONG_NAME, 320, 800);
    await expect(page).toHaveScreenshot('name-long-phone.png');
  });

  test('a long name on a tablet', async ({ page }) => {
    await show(page, LONG_NAME, 768, 1000);
    await expect(page).toHaveScreenshot('name-long-tablet.png');
  });

  test('edit profile over the dashboard', async ({ page }) => {
    const dashboard = await show(page, null);
    const edit = new EditProfileDialog(page);
    await dashboard.addYourName.click();
    await expect(edit.dialog).toBeVisible();
    await expect(page).toHaveScreenshot('edit-profile.png');
  });
});
