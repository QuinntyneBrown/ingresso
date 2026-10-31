import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { DEFAULT_TILES, FakeTile, stubTiles } from '../support/stub-api';

const NOW = new Date('2026-10-31T21:55:00Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

const tile = (i: number, name: string, extra: Partial<FakeTile>): FakeTile => ({
  ...DEFAULT_TILES[0],
  id: `lo-${i}`,
  name,
  url: `https://${name.toLowerCase()}.example.com`,
  description: 'A description',
  x: ((i - 1) % 3) * 4,
  y: Math.floor((i - 1) / 3) * 3,
  cols: 4,
  rows: 3,
  lastOpenedAt: null,
  ...extra,
});

test.describe('Last opened', () => {
  test.use({ timezoneId: 'UTC', locale: 'en-US' });

  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await stubTiles(page, [
      tile(1, 'Mail', { lastOpenedAt: minutesAgo(5) }),
      tile(2, 'Maps', { lastOpenedAt: null }),
      tile(3, 'Notes', { lastOpenedAt: minutesAgo(-3) }),
      tile(4, 'Chat', { lastOpenedAt: minutesAgo(5), cols: 3, rows: 2, x: 0, y: 3 }),
      tile(5, 'Docs', { lastOpenedAt: null, cols: 3, rows: 2, x: 3, y: 3 }),
    ]);
    dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
  });

  // Acceptance Test
  // Traces to: L2-014
  // Description: A tile opened 5 minutes ago says so, and a tile never opened says that.
  test('a tile says when it was last opened, or that it never was', async () => {
    await expect(dashboard.openedText('Mail')).toHaveText('Opened 5 minutes ago');
    await expect(dashboard.openedText('Maps')).toHaveText('Never opened');
  });

  // Acceptance Test
  // Traces to: L2-014
  // Description: A time slightly ahead of the browser's clock never reads as the future.
  test('a time a little ahead of the browser clock reads as just now', async () => {
    await expect(dashboard.openedText('Notes')).toHaveText('Opened just now');
  });

  // Acceptance Test
  // Traces to: L2-014
  // Description: The exact time of the last open is the line's accessible title.
  test('the exact time is the accessible title', async () => {
    await expect(dashboard.openedText('Mail')).toHaveAttribute('title', /October 31, 2026.*9:50\s?PM/);
    await expect(dashboard.openedText('Maps')).not.toHaveAttribute('title', /.+/);
  });

  // Acceptance Test
  // Traces to: L2-046
  // Description: Every tile, large or small, has an accessible name with the app name and its last-opened text.
  test('every tile has an accessible name with the app and when it was opened', async () => {
    await expect(dashboard.linkNamed('Mail', 'Opened 5 minutes ago')).toBeVisible();
    await expect(dashboard.linkNamed('Maps', 'Never opened')).toBeVisible();
    await expect(dashboard.linkNamed('Chat', 'Opened 5 minutes ago')).toBeVisible();
    await expect(dashboard.linkNamed('Docs', 'Never opened')).toBeVisible();
  });
});
