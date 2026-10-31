// Acceptance Test
// Traces to: L2-031
// Description: The sign-out confirmation, its busy and failed states, and the open account menu look as designed in docs/mocks/dialogs/sign-out and pages/dashboard/account-menu.
import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { DEFAULT_TILES, stubTiles } from '../support/stub-api';

test.describe('Sign out, visually', () => {
  async function open(page: import('@playwright/test').Page) {
    await stubTiles(page, DEFAULT_TILES);
    await page.setViewportSize({ width: 1280, height: 800 });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    return dashboard;
  }

  test('account menu', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.shell.accountMenu.click();
    await expect(dashboard.shell.signOutItem).toBeVisible();
    await expect(page).toHaveScreenshot('account-menu.png');
  });

  test('default', async ({ page }) => {
    const dashboard = await open(page);
    const dialog = new SignOutDialog(page);
    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dashboard = await open(page);
    const dialog = new SignOutDialog(page);
    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await expect(dialog.dialog).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('default-dark.png');
  });

  test('busy', async ({ page }) => {
    const dashboard = await open(page);
    await page.route('**/api/auth/sign-out', () => new Promise(() => undefined));
    const dialog = new SignOutDialog(page);
    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await dialog.signOut.click();
    await expect(dialog.signingOut).toBeDisabled();
    await expect(dialog.dialog).toHaveScreenshot('busy.png');
  });

  test('failed', async ({ page }) => {
    const dashboard = await open(page);
    await page.route('**/api/auth/sign-out', (route) =>
      route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' }),
    );
    const dialog = new SignOutDialog(page);
    await dashboard.shell.accountMenu.click();
    await dashboard.shell.signOutItem.click();
    await dialog.signOut.click();
    await expect(dialog.failed).toBeVisible();
    await expect(dialog.dialog).toHaveScreenshot('failed.png');
  });
});
