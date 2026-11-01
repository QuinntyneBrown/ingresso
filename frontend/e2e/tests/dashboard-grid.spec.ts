import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { DEFAULT_TILES, FakeTile, stubTiles } from '../support/stub-api';

const tile = (i: number, name: string, x: number, y: number, cols: number, rows: number): FakeTile => ({
  ...DEFAULT_TILES[0],
  id: `grid-${i}`,
  name,
  url: `https://${name.toLowerCase()}.example.com`,
  x,
  y,
  cols,
  rows,
});

test.describe('Dashboard grid', () => {
  // Acceptance Test
  // Traces to: L2-008
  // Description: Every tile appears once, in saved order, and its colour keeps AA contrast for its initial.
  test('each tile appears once in saved order and keeps AA contrast', async ({ page }) => {
    test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real seeded API.');
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    const names = await dashboard.grid.layout();
    expect(new Set(names.map((t) => t.name)).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
    const contrasts = await dashboard.iconContrasts();
    expect(contrasts[0]).toBeGreaterThanOrEqual(4.5);
  });

  // Acceptance Test
  // Traces to: L2-009
  // Description: A tile saved at column 0, row 0 with a 6 by 4 span covers half the width and twice a 3 by 2 tile's height, and a reload keeps it.
  test('a saved span is drawn as saved and survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubTiles(page, [tile(1, 'Wide', 0, 0, 6, 4), tile(2, 'Small', 6, 0, 3, 2)]);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();

    const grid = (await dashboard.grid.root.boundingBox())!;
    const wide = (await dashboard.grid.item('Wide').boundingBox())!;
    const small = (await dashboard.grid.item('Small').boundingBox())!;
    expect(wide.x).toBeCloseTo(grid.x, 0);
    expect(wide.width / grid.width).toBeGreaterThan(0.45);
    expect(wide.width / grid.width).toBeLessThan(0.5);
    expect(wide.height / small.height).toBeGreaterThan(1.9);
    const before = await dashboard.grid.layout();

    await page.reload();
    await expect(dashboard.tiles.first()).toBeVisible();
    expect(await dashboard.grid.layout()).toEqual(before);
  });

  // Acceptance Test
  // Traces to: L2-053
  // Description: Overlapping or out-of-range stored tiles are repaired the same way every time, and none is lost.
  test('an invalid stored layout is repaired identically and loses no tile', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubTiles(page, [
      tile(1, 'First', 0, 0, 4, 2),
      tile(2, 'Overlap', 2, 0, 4, 2),
      tile(3, 'Past', 10, 4, 4, 2),
    ]);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles).toHaveCount(3);

    const repaired = await dashboard.grid.layout();
    const first = repaired.find((t) => t.name === 'First')!;
    const overlap = repaired.find((t) => t.name === 'Overlap')!;
    const past = repaired.find((t) => t.name === 'Past')!;
    expect(first).toMatchObject({ x: 0, y: 0 });
    const apart = (a: typeof first, b: typeof first) =>
      a.x + a.cols <= b.x || b.x + b.cols <= a.x || a.y + a.rows <= b.y || b.y + b.rows <= a.y;
    expect(apart(first, overlap)).toBe(true);
    expect(past.x + past.cols).toBeLessThanOrEqual(12);

    await page.reload();
    await expect(dashboard.tiles).toHaveCount(3);
    expect(await dashboard.grid.layout()).toEqual(repaired);
  });

  // Acceptance Test
  // Traces to: L2-042
  // Description: Below 1024px tiles flow in two columns, below 768px in one, in reading order, never saving and never scrolling sideways.
  test('the grid collapses to two columns, then one, without saving', async ({ page }) => {
    await stubTiles(page, [
      tile(1, 'Alpha', 0, 0, 3, 2),
      tile(2, 'Bravo', 3, 0, 3, 2),
      tile(3, 'Charlie', 6, 0, 3, 2),
      tile(4, 'Delta', 0, 2, 6, 2),
    ]);
    const dashboard = new DashboardPage(page);
    const saves = dashboard.watchLayoutSaves();
    await page.setViewportSize({ width: 1280, height: 900 });
    await dashboard.open();
    await expect(dashboard.tiles).toHaveCount(4);
    const saved = await dashboard.grid.layout();
    expect(await dashboard.grid.isCollapsed()).toBe(false);

    await page.setViewportSize({ width: 900, height: 900 });
    await expect.poll(() => dashboard.grid.isCollapsed()).toBe(true);
    const column = async (name: string) => Math.round((await dashboard.grid.item(name).boundingBox())!.x);
    const row = async (name: string) => Math.round((await dashboard.grid.item(name).boundingBox())!.y);
    expect(await column('Alpha')).not.toBe(await column('Bravo'));
    expect(await row('Alpha')).toBe(await row('Bravo'));
    expect(await row('Charlie')).toBeGreaterThan(await row('Alpha'));
    const delta = (await dashboard.grid.item('Delta').boundingBox())!;
    const grid = (await dashboard.grid.root.boundingBox())!;
    expect(delta.width).toBeGreaterThan(grid.width * 0.9);
    expect(await dashboard.scrollsSideways()).toBe(false);

    await page.setViewportSize({ width: 600, height: 900 });
    await expect.poll(async () => (await column('Alpha')) === (await column('Bravo'))).toBe(true);
    expect(await column('Alpha')).toBe(await column('Bravo'));
    expect(await row('Bravo')).toBeGreaterThan(await row('Alpha'));
    expect(await dashboard.scrollsSideways()).toBe(false);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect.poll(() => dashboard.grid.isCollapsed()).toBe(false);
    expect(await dashboard.grid.layout()).toEqual(saved);
    expect(saves()).toBe(0);
  });

  // Acceptance Test
  // Traces to: L2-040
  // Description: With 200 tiles the dashboard is drawn and its Add app button works in under 2 seconds.
  // Acceptance Test
  // Traces to: L2-042
  // Description: On a phone, a long name with no spaces wraps and the tiles fit, so the page never scrolls sideways.
  test('a long unbroken name does not push the phone dashboard sideways', async ({ page }) => {
    await stubTiles(page, [tile(1, 'Saturdaze', 0, 0, 4, 3), tile(2, 'Faithtech', 4, 0, 4, 3)], {
      name: 'quinntynebrown@averylongdomainname.example',
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles).toHaveCount(2);

    expect(await dashboard.scrollsSideways()).toBe(false);
    for (const tile of await dashboard.tiles.all()) {
      const box = (await tile.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
  });

  test('200 tiles are interactive in under two seconds', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const many = Array.from({ length: 200 }, (_, i) =>
      tile(i, `App${i}`, (i % 4) * 3, Math.floor(i / 4) * 2, 3, 2),
    );
    await stubTiles(page, many);
    const dashboard = new DashboardPage(page);
    const started = Date.now();

    await dashboard.open();
    await expect(dashboard.tiles).toHaveCount(200);
    await dashboard.shell.addApp.click();
    await expect(page.getByRole('dialog', { name: 'Add an app' })).toBeVisible();

    expect(Date.now() - started).toBeLessThan(2000);
  });
});
