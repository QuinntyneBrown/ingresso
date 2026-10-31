import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';

const SEEDED = [
  'Gmail',
  'Slack',
  'Linear',
  'GitHub',
  'Figma',
  'Notion',
  'Salesforce',
  'Workday',
  'Zoom',
  '1Password',
  'Datadog',
];

test.describe('Arrange tiles', () => {
  test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real API.');
  test.use({ viewport: { width: 1280, height: 1100 } });

  let dashboard: DashboardPage;
  let saved: Awaited<ReturnType<DashboardPage['savedLayout']>>;
  let saves: () => number;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.open();
    saved = await dashboard.savedLayout();
    await dashboard.parkTilesBelow(SEEDED, 100);
    await page.reload();
    await expect(dashboard.tiles.first()).toBeVisible();
    saves = dashboard.watchLayoutSaves();
  });

  test.afterEach(async () => {
    await dashboard.restoreLayout(saved);
  });

  // Acceptance Test
  // Traces to: L2-015
  // Description: Edit layout announces edit mode, gives each tile a handle and an Edit action, and Done puts the links back.
  test('edit mode is announced and shows handles and Edit actions', async () => {
    await dashboard.enterEditLayout();

    await expect(dashboard.layoutBar).toHaveAttribute('role', 'status');
    await expect(dashboard.layoutBar).toContainText('Drag a tile to move it');
    await expect(dashboard.grid.item('Gmail').locator('[data-ig-handle]')).toBeVisible();
    await expect(dashboard.editButton('Gmail')).toBeVisible();

    await dashboard.doneInBar.click();
    await expect(dashboard.layoutBar).toBeHidden();
    await expect(dashboard.tileLink('Gmail')).toHaveCount(1);
  });

  // Acceptance Test
  // Traces to: L2-016
  // Description: While dragging, a shadow shows the destination; over another tile it shows a refusal, and dropping there changes and saves nothing.
  test('a drop onto another tile is refused: the shadow warns, the tile returns, nothing is saved', async () => {
    await dashboard.enterEditLayout();
    const gmail = await dashboard.grid.placement('Gmail');
    const slack = await dashboard.grid.placement('Slack');

    await dashboard.grid.holdDrag('Slack', gmail.x - slack.x + 1, gmail.y - slack.y);
    await expect.poll(() => dashboard.grid.shadowState()).toBe('refused');
    await dashboard.grid.drop();

    await expect.poll(() => dashboard.grid.placement('Slack')).toEqual(slack);
    expect(await dashboard.grid.placement('Gmail')).toEqual(gmail);
    expect(saves()).toBe(0);
  });

  // Acceptance Test
  // Traces to: L2-016
  // Description: Over free cells the shadow says the drop is allowed, and Escape cancels the drag so the tile stays where it was.
  test('Escape cancels a drag', async ({ page }) => {
    await dashboard.enterEditLayout();
    const free = await dashboard.grid.firstEmptyRow();
    const figma = await dashboard.grid.placement('Figma');

    await dashboard.grid.holdDrag('Figma', 0, free - figma.y);
    await expect.poll(() => dashboard.grid.shadowState()).toBe('valid');
    await page.keyboard.press('Escape');
    await dashboard.grid.drop();

    await expect.poll(() => dashboard.grid.shadowState()).toBe('none');
    expect(await dashboard.grid.placement('Figma')).toEqual(figma);
    expect(saves()).toBe(0);
  });

  // Acceptance Test
  // Traces to: L2-016, L2-041
  // Description: When the save fails the previous layout is restored and an error toast is shown, and the new layout was shown first.
  test('a failed save restores the layout and says so', async ({ page }) => {
    await page.route('**/api/tiles/layout', async (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      await new Promise((resolve) => setTimeout(resolve, 600));
      return route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' });
    });
    await dashboard.enterEditLayout();
    const free = await dashboard.grid.firstEmptyRow();
    const figma = await dashboard.grid.placement('Figma');

    await dashboard.grid.drag('Figma', 0, free - figma.y);

    await expect
      .poll(async () => (await dashboard.grid.placement('Figma')).y, { timeout: 500 })
      .toBeGreaterThan(figma.y);
    await expect(dashboard.shell.toast(/save|layout/i)).toBeVisible();
    await expect.poll(() => dashboard.grid.placement('Figma')).toEqual(figma);
  });

  // Acceptance Test
  // Traces to: L2-017
  // Description: Each tile in edit mode describes its keys through its accessible description.
  test('a tile in edit mode carries key instructions', async () => {
    await dashboard.enterEditLayout();

    const text = await dashboard.grid.instructions('Gmail');

    expect(text).toMatch(/arrow/i);
    expect(text).toMatch(/shift/i);
  });

  // Acceptance Test
  // Traces to: L2-051
  // Description: A tile cannot be widened past column 12, and the limit is announced.
  test('widening past the edge is refused and announced', async () => {
    await dashboard.enterEditLayout();
    const right = (await dashboard.grid.layout()).find((t) => t.x + t.cols === 12)!;

    await dashboard.grid.press(right.name, 'Shift+ArrowRight');

    expect((await dashboard.grid.placement(right.name)).cols).toBe(right.cols);
    await expect.poll(() => dashboard.grid.announcement()).not.toBe('');
  });

  // Acceptance Test
  // Traces to: L2-020
  // Description: Leaving the dashboard and coming back opens it in normal mode.
  test('navigating away and back leaves edit mode', async ({ page }) => {
    await dashboard.enterEditLayout();

    await dashboard.navigateWithinApp('/directory');
    await expect(page).toHaveURL(/directory/);
    await dashboard.shell.brand.click();
    await expect(page).toHaveURL(/\/$/);

    await expect(dashboard.tiles.first()).toBeVisible();
    await expect(dashboard.layoutBar).toBeHidden();
    expect(await dashboard.grid.isEditable()).toBe(false);
  });

  // Acceptance Test
  // Traces to: L2-054
  // Description: Narrowing the window below 1024px ends edit mode and removes the layout bar.
  test('narrowing the window ends edit mode', async ({ page }) => {
    await dashboard.enterEditLayout();

    await page.setViewportSize({ width: 900, height: 900 });

    await expect(dashboard.layoutBar).toBeHidden();
    await expect.poll(() => dashboard.grid.isEditable()).toBe(false);
    await expect(dashboard.shell.editLayout).toBeDisabled();
  });

  // Acceptance Test
  // Traces to: L2-041
  // Description: A move is drawn within 100 ms, before the save finishes.
  test('a move is shown within 100 ms, before the save finishes', async ({ page }) => {
    await page.route('**/api/tiles/layout', async (route) => {
      if (route.request().method() === 'PUT') await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fallback();
    });
    await dashboard.enterEditLayout();
    const bottom = (await dashboard.grid.layout()).at(-1)!;

    const milliseconds = await dashboard.grid.millisecondsToMove(bottom.name, 'ArrowDown');

    expect(milliseconds).toBeLessThan(100);
  });
});
