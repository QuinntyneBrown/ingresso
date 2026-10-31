// Acceptance Test
// Traces to: L2-015, L2-016, L2-017, L2-019, L2-020, L2-042, L2-051, L2-052, L2-054
// Description: Edit mode moves and resizes tiles on the 12-column grid, refuses occupied cells, saves the
// layout, resets it after confirmation, and is unavailable below 1024px.
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

test.describe('Edit layout', () => {
  let dashboard: DashboardPage;
  let saved: Awaited<ReturnType<DashboardPage['savedLayout']>>;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.open();
    saved = await dashboard.savedLayout();
    // Tiles other specs added are parked far below, so these tests start from the seeded layout.
    await dashboard.parkTilesBelow(SEEDED, 100);
    await page.reload();
  });

  test.afterEach(async () => {
    await dashboard.restoreLayout(saved);
  });

  test('Edit layout shows the layout bar and grid affordances, and Done turns it off', async () => {
    const [first] = await dashboard.tileNames();

    await dashboard.enterEditLayout();

    await expect(dashboard.layoutBar).toContainText(
      'Drag a tile to move it, or drag its corner to resize it. Changes save as you go.',
    );
    await expect.poll(() => dashboard.grid.isEditable()).toBe(true);
    await expect(dashboard.tile(first).getByRole('button', { name: `Edit ${first}` })).toBeVisible();
    await expect(dashboard.tile(first).getByRole('link')).toHaveCount(0);

    await dashboard.doneInBar.click();

    await expect(dashboard.layoutBar).toBeHidden();
    await expect.poll(() => dashboard.grid.isEditable()).toBe(false);
    await expect(dashboard.tile(first).getByRole('link')).toHaveCount(1);
  });

  test('the arrow keys move a tile into free cells, announce it, and the move survives a reload', async ({
    page,
  }) => {
    await dashboard.enterEditLayout();

    await dashboard.grid.press('Datadog', 'ArrowDown');

    await expect.poll(() => dashboard.grid.placement('Datadog')).toEqual({ x: 9, y: 6, cols: 3, rows: 2 });
    await expect.poll(() => dashboard.grid.announcement()).toBe('Datadog at column 10, row 7.');
    await page.reload();
    await expect.poll(() => dashboard.grid.placement('Datadog')).toEqual({ x: 9, y: 6, cols: 3, rows: 2 });
  });

  test('a move into another tile is refused and announced, and nothing moves', async () => {
    await dashboard.enterEditLayout();

    await dashboard.grid.press('Gmail', 'ArrowRight');

    await expect.poll(() => dashboard.grid.announcement()).toContain('blocked by another tile');
    expect(await dashboard.grid.placement('Gmail')).toEqual({ x: 0, y: 0, cols: 4, rows: 3 });
    expect(await dashboard.grid.placement('Slack')).toEqual({ x: 4, y: 0, cols: 4, rows: 3 });
  });

  test('Shift and an arrow resize a tile down to its 2-column limit', async () => {
    await dashboard.enterEditLayout();

    await dashboard.grid.press('Datadog', 'Shift+ArrowLeft');
    await expect.poll(() => dashboard.grid.placement('Datadog')).toEqual({ x: 9, y: 5, cols: 2, rows: 2 });
    await dashboard.grid.press('Datadog', 'Shift+ArrowLeft');

    await expect.poll(() => dashboard.grid.announcement()).toContain('blocked by its size limit');
    expect(await dashboard.grid.placement('Datadog')).toEqual({ x: 9, y: 5, cols: 2, rows: 2 });
  });

  test.describe('with the pointer', () => {
    // Tall enough that the free rows under the tiles are on screen for the mouse.
    test.use({ viewport: { width: 1280, height: 1100 } });

    test('dragging a tile to free cells moves it, and the layout is saved', async ({ page }) => {
      await dashboard.enterEditLayout();
      const free = await dashboard.grid.firstEmptyRow();
      const { y } = await dashboard.grid.placement('Figma');

      await dashboard.grid.drag('Figma', 0, free - y);

      await expect.poll(() => dashboard.grid.placement('Figma')).toEqual({ x: 3, y: free, cols: 3, rows: 2 });
      await page.reload();
      await expect.poll(() => dashboard.grid.placement('Figma')).toEqual({ x: 3, y: free, cols: 3, rows: 2 });
    });

    test('dragging the corner handle resizes a tile', async () => {
      await dashboard.enterEditLayout();

      await dashboard.grid.resize('Datadog', 0, 1);

      await expect.poll(() => dashboard.grid.placement('Datadog')).toEqual({ x: 9, y: 5, cols: 3, rows: 3 });
    });
  });

  test('Reset layout asks first; keeping the layout changes nothing', async () => {
    await dashboard.enterEditLayout();
    await dashboard.grid.press('Datadog', 'ArrowDown');
    await expect.poll(() => dashboard.grid.placement('Datadog')).toMatchObject({ y: 6 });

    await dashboard.resetLayout.click();
    await expect(dashboard.resetDialog).toBeVisible();
    await dashboard.keepLayout.click();

    await expect(dashboard.resetDialog).toBeHidden();
    expect(await dashboard.grid.placement('Datadog')).toMatchObject({ y: 6 });
  });

  test('confirming Reset layout packs tiles in creation order at 3 by 2 and says so', async () => {
    await dashboard.enterEditLayout();

    await dashboard.resetLayout.click();
    await dashboard.confirmReset.click();

    await expect(dashboard.shell.toast('Layout reset')).toBeVisible();
    const cells = await dashboard.grid.layout();
    // Every tile is 3 by 2, four to a row, with no gaps, in reading order.
    expect(cells.map(({ x, y, cols, rows }) => ({ x, y, cols, rows }))).toEqual(
      cells.map((_, i) => ({ x: (i % 4) * 3, y: Math.floor(i / 4) * 2, cols: 3, rows: 2 })),
    );
    // The seeded apps keep the order they were created in.
    const seeded = ['Gmail', 'Slack', 'Linear', 'GitHub', 'Figma'];
    expect(cells.map((cell) => cell.name).filter((name) => seeded.includes(name))).toEqual(seeded);
  });
});

test.describe('Edit layout on a narrow window', () => {
  test.use({ viewport: { width: 900, height: 800 } });

  test('below 1024px tiles flow in reading order and Edit layout is unavailable', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const saves: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().includes('/api/tiles')) saves.push(request.url());
    });
    await dashboard.open();

    await expect.poll(() => dashboard.grid.isCollapsed()).toBe(true);
    await expect(dashboard.shell.editLayout).toBeDisabled();
    await expect(dashboard.shell.editLayoutUnavailable).toHaveText(
      'Widen the window to at least 1024 pixels to edit the layout.',
    );
    expect((await dashboard.tileNames()).slice(0, 4)).toEqual(['Gmail', 'Slack', 'Linear', 'GitHub']);
    expect(saves).toEqual([]);
  });
});
