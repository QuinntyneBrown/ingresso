import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { DEFAULT_TILES, FakeTile, stubTiles } from '../support/stub-api';

const tile = (i: number, name: string, extra: Partial<FakeTile> = {}): FakeTile => ({
  ...DEFAULT_TILES[0],
  id: `qj-${i}`,
  name,
  url: `https://${name.toLowerCase()}.example.com`,
  description: null,
  category: null,
  x: ((i - 1) % 4) * 3,
  y: Math.floor((i - 1) / 4) * 2,
  cols: 3,
  rows: 2,
  ...extra,
});

const TILES = [
  tile(1, 'Mail'),
  tile(2, 'Maps'),
  tile(3, 'Notes', { category: 'Work' }),
  tile(4, 'Wiki', { description: 'Internal docs' }),
];

async function open(page: import('@playwright/test').Page) {
  await page
    .context()
    .route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>An app</title>' }),
    );
  await stubTiles(page, TILES);
  const dashboard = new DashboardPage(page);
  await dashboard.open();
  await expect(dashboard.tiles).toHaveCount(4);
  return dashboard;
}

test.describe('Quick jump', () => {
  // Acceptance Test
  // Traces to: L2-021
  // Description: "/" outside a text field focuses the search without typing the slash; inside a text field it is typed.
  test('"/" opens the search only outside text fields', async ({ page }) => {
    const dashboard = await open(page);

    await dashboard.shell.pressSlash();
    await expect(dashboard.shell.search).toBeFocused();
    await expect(dashboard.shell.search).toHaveValue('');

    await dashboard.shell.typeInSearch('a');
    await dashboard.shell.pressSlash();
    await expect(dashboard.shell.search).toHaveValue('a/');
  });

  // Acceptance Test
  // Traces to: L2-021
  // Description: Escape closes the search, clears it, and returns focus to where it was.
  test('Escape closes the search and returns focus', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.tileLink('Maps').focus();

    await dashboard.shell.pressSlash();
    await dashboard.shell.typeInSearch('ma');
    await dashboard.shell.press('Escape');

    await expect(dashboard.shell.search).toHaveValue('');
    await expect(dashboard.shell.search).not.toBeFocused();
    await expect(dashboard.tileLink('Maps')).toBeFocused();
    await expect(dashboard.tiles).toHaveCount(4);
  });

  // Acceptance Test
  // Traces to: L2-022
  // Description: Search matches name, address, category and description, ignoring case, and says when nothing matches.
  test('filters by name, address, category and description, ignoring case', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.shell.pressSlash();

    await dashboard.shell.typeInSearch('MA');
    await expect(dashboard.tiles).toHaveCount(2);
    await expect(dashboard.tile('Mail')).toBeVisible();
    await expect(dashboard.tile('Maps')).toBeVisible();

    await dashboard.shell.typeInSearch('work');
    await expect(dashboard.tile('Notes')).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(1);

    await dashboard.shell.typeInSearch('wiki.example');
    await expect(dashboard.tile('Wiki')).toBeVisible();

    await dashboard.shell.typeInSearch('INTERNAL');
    await expect(dashboard.tile('Wiki')).toBeVisible();

    await dashboard.shell.typeInSearch('zzz');
    await expect(dashboard.noMatches).toBeVisible();
    await expect(dashboard.tiles).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-022
  // Description: The result count is announced politely as the results change.
  test('the result count is announced politely', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.shell.pressSlash();

    await dashboard.shell.typeInSearch('ma');
    await expect(dashboard.shell.searchStatus).toHaveText('2 apps match');
    await expect(dashboard.shell.searchStatus).not.toHaveAttribute('aria-live', 'assertive');

    await dashboard.shell.typeInSearch('wiki');
    await expect(dashboard.shell.searchStatus).toHaveText('1 app matches');

    await dashboard.shell.typeInSearch('zzz');
    await expect(dashboard.shell.searchStatus).toHaveText('No apps match');
  });

  // Acceptance Test
  // Traces to: L2-023
  // Description: The first result is highlighted, and Down and Up move the highlight and wrap at the ends.
  test('the first match is highlighted and the arrows move and wrap', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.shell.pressSlash();
    await dashboard.shell.typeInSearch('ma');

    await expect(dashboard.highlighted).toHaveCount(1);
    await expect(dashboard.highlighted).toContainText('Mail');

    await dashboard.shell.press('ArrowDown');
    await expect(dashboard.highlighted).toContainText('Maps');
    await dashboard.shell.press('ArrowDown');
    await expect(dashboard.highlighted).toContainText('Mail');
    await dashboard.shell.press('ArrowUp');
    await expect(dashboard.highlighted).toContainText('Maps');
  });

  // Acceptance Test
  // Traces to: L2-023, L2-013
  // Description: Enter opens the highlighted app in a new tab and records that it was opened.
  test('Enter opens the highlighted app and records it', async ({ page }) => {
    const dashboard = await open(page);
    await dashboard.shell.pressSlash();
    await dashboard.shell.typeInSearch('ma');
    await dashboard.shell.press('ArrowDown');
    const recorded = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/qj-2/opened'));
    const popup = page.waitForEvent('popup');

    await dashboard.shell.press('Enter');

    expect((await popup).url()).toBe('https://maps.example.com/');
    await recorded;
  });

  // Acceptance Test
  // Traces to: L2-023
  // Description: With no results, Enter opens nothing.
  test('Enter with no results opens nothing', async ({ page }) => {
    const dashboard = await open(page);
    let opened = false;
    page.context().on('page', () => (opened = true));
    await dashboard.shell.pressSlash();
    await dashboard.shell.typeInSearch('zzz');

    await dashboard.shell.press('Enter');
    await page.waitForTimeout(500);

    expect(opened).toBe(false);
  });

  // Acceptance Test
  // Traces to: L2-022, L2-042
  // Description: Matches close up into the first free spaces while searching, nothing is saved, and clearing the search restores the saved places.
  test('matches close up while searching without saving the layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await stubTiles(page, [
      tile(1, 'Mail', { x: 0, y: 0 }),
      tile(2, 'Maps', { x: 9, y: 6 }),
      tile(3, 'Notes', { x: 3, y: 0 }),
    ]);
    const dashboard = new DashboardPage(page);
    const saves = dashboard.watchLayoutSaves();
    await dashboard.open();
    await expect(dashboard.tiles).toHaveCount(3);
    const saved = await dashboard.grid.placement('Maps');

    await dashboard.shell.pressSlash();
    await dashboard.shell.typeInSearch('ma');
    await expect(dashboard.tiles).toHaveCount(2);

    expect(await dashboard.grid.placement('Mail')).toMatchObject({ x: 0, y: 0 });
    expect(await dashboard.grid.placement('Maps')).toMatchObject({ x: 3, y: 0 });

    await dashboard.shell.typeInSearch('');
    await expect(dashboard.tiles).toHaveCount(3);
    expect(await dashboard.grid.placement('Maps')).toEqual(saved);
    expect(saves()).toBe(0);
  });
});
