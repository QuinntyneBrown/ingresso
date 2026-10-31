import { expect, test } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Open an app', () => {
  test.beforeEach(async ({ page }) => {
    // The apps on the dashboard are real sites; answer for them so no test depends on the internet.
    await page
      .context()
      .route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: '<title>An app</title>' }),
      );
  });

  // Acceptance Test
  // Traces to: L2-012
  // Description: A tile's link opens in a new tab without exposing ingresso (target _blank, rel noopener noreferrer).
  test('a tile link opens a new tab and does not expose ingresso', async ({ page }) => {
    test.skip(!!process.env['E2E_FAKE_API'], 'Needs the real seeded API.');
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const [first] = await dashboard.tileNames();

    const link = dashboard.tileLink(first);

    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
    await expect(link).toHaveAttribute('href', /^https?:\/\//);
  });

  // Acceptance Test
  // Traces to: L2-012
  // Description: Pressing Enter on a focused tile opens its app in a new tab.
  test('pressing Enter on a tile opens its app', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const [first] = await dashboard.tileNames();

    const popup = await dashboard.openAppWithKeyboard(first);

    expect(popup.url()).not.toBe('about:blank');
    expect(popup.url()).toMatch(/^https?:\/\//);
  });

  // Acceptance Test
  // Traces to: L2-012
  // Description: In edit mode, clicking a tile does not open its app.
  test('in edit mode a tile does not open its app', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const [first] = await dashboard.tileNames();
    await dashboard.enterEditLayout();
    let opened = false;
    page.context().on('page', () => (opened = true));
    const recorded: string[] = [];
    page.on('request', (r) => r.url().endsWith('/opened') && recorded.push(r.url()));

    await dashboard.tile(first).click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(600);

    expect(opened).toBe(false);
    expect(recorded).toEqual([]);
  });

  // Acceptance Test
  // Traces to: L2-013
  // Description: If recording the open fails, the app still opens and no error blocks the person.
  test('the app opens even when recording the open fails', async ({ page }) => {
    await page.route('**/api/tiles/*/opened', (route) => route.fulfill({ status: 500, body: '{}' }));
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const [first] = await dashboard.tileNames();

    const popup = await dashboard.openApp(first);

    expect(popup.url()).toMatch(/^https?:\/\//);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  // Acceptance Test
  // Traces to: L2-038
  // Description: Opening an app sends only the tile id to ingresso's own server, with no body, and nothing goes to a third party.
  test('opening an app records only the tile and talks only to ingresso', async ({ page }) => {
    const foreign: string[] = [];
    const records: { url: string; body: string | null }[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') foreign.push(r.url());
      if (r.method() === 'POST' && url.pathname.endsWith('/opened'))
        records.push({ url: r.url(), body: r.postData() });
    });
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await expect(dashboard.tiles.first()).toBeVisible();
    const [first] = await dashboard.tileNames();

    await dashboard.openApp(first);
    await expect(dashboard.tile(first)).toContainText('Opened just now');

    expect(records).toHaveLength(1);
    expect(JSON.parse(records[0].body || '{}')).toEqual({});
    expect(new URL(records[0].url).search).toBe('');
    expect(foreign).toEqual([]);
  });
});
