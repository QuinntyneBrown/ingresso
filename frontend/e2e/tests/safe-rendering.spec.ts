import { expect, test } from '../fixtures';
import { AddAppDialog } from '../pages/add-app.dialog';
import { DashboardPage } from '../pages/dashboard.page';
import { EditAppDialog } from '../pages/edit-app.dialog';

test.describe('Safe rendering of user content', () => {
  // Acceptance Test
  // Traces to: L2-037
  // Description: Tile text renders as text, never as markup, and no script runs.
  test('a tile named like an HTML element shows the literal text and runs nothing', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const add = new AddAppDialog(page);
    const name = '<img src=x onerror=window.__pwned=1>';
    await dashboard.open();

    await dashboard.shell.addApp.click();
    await add.add({
      name,
      url: 'https://example.com/?q="quoted"&tag=<b>bold</b>',
      description: '<script>window.__pwned=1</script> and <b>bold</b>',
    });

    const tile = dashboard.tile(name);
    await expect(tile).toBeVisible();
    await expect(tile.getByText(name, { exact: true })).toBeVisible();
    await expect(tile.locator('img, b, script')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();

    // Clean up so the run leaves the dashboard as it found it.
    await dashboard.enterEditLayout();
    await dashboard.editApp(name);
    await new EditAppDialog(page).deleteApp();
  });
});
