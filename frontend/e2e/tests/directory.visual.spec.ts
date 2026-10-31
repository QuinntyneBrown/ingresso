// Acceptance Test
// Traces to: L2-024
// Description: The directory looks as designed in docs/mocks/pages/directory, with its Added marks, search results and no-match state.
import { expect, test } from '../fixtures';
import { DirectoryPage } from '../pages/directory.page';
import { DEFAULT_TILES, FakeTile, stubTiles } from '../support/stub-api';

const tile = (i: number, name: string, url: string): FakeTile => ({
  ...DEFAULT_TILES[0],
  id: `dir-${i}`,
  name,
  url,
  x: (i - 1) * 3,
  y: 0,
  cols: 3,
  rows: 2,
});

const ADDED = [
  tile(1, 'Slack', 'https://app.slack.com'),
  tile(2, 'Figma', 'https://figma.com'),
  tile(3, 'GitHub', 'https://github.com'),
];

test.describe('Directory, visually', () => {
  async function show(page: import('@playwright/test').Page, width = 1280, height = 1100) {
    await stubTiles(page, ADDED);
    await page.setViewportSize({ width, height });
    const directory = new DirectoryPage(page);
    await directory.open();
    await expect(directory.heading).toBeVisible();
    await expect(directory.entry('Slack')).toBeVisible();
    return directory;
  }

  test('default', async ({ page }) => {
    await show(page);
    await expect(page).toHaveScreenshot('default.png');
  });

  test('default in dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await show(page);
    await expect(page).toHaveScreenshot('default-dark.png');
  });

  test('search results', async ({ page }) => {
    const directory = await show(page);
    await directory.search.fill('sent');
    await expect.poll(() => directory.names()).toEqual(['Sentry']);
    await expect(page).toHaveScreenshot('search-results.png');
  });

  test('no matches', async ({ page }) => {
    const directory = await show(page);
    await directory.search.fill('zzzz');
    await expect(directory.noMatches).toBeVisible();
    await expect(page).toHaveScreenshot('no-matches.png');
  });

  test('phone', async ({ page }) => {
    await show(page, 390, 900);
    await expect(page).toHaveScreenshot('phone.png');
  });
});
