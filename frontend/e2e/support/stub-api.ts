import { Page, Route } from '@playwright/test';
import { guarded } from './guarded';

export interface FakeTile {
  id: string;
  name: string;
  url: string;
  description: string | null;
  color: string;
  initial: string;
  category: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/** Packs tiles in order, each at its own span (reset: 3 by 2), at the first free cell in reading order. */
const pack = (tiles: FakeTile[], reset = false): FakeTile[] => {
  const placed: FakeTile[] = [];
  const free = (x: number, y: number, cols: number, rows: number) =>
    placed.every((t) => x >= t.x + t.cols || t.x >= x + cols || y >= t.y + t.rows || t.y >= y + rows);
  for (const tile of tiles) {
    const [cols, rows] = reset ? [3, 2] : [tile.cols, tile.rows];
    let spot: [number, number] | null = null;
    for (let y = 0; spot === null; y++) {
      for (let x = 0; x + cols <= 12 && spot === null; x++) if (free(x, y, cols, rows)) spot = [x, y];
    }
    placed.push({ ...tile, x: spot[0], y: spot[1], cols, rows });
  }
  return placed;
};

const NOW = Date.parse('2026-11-02T14:00:00Z');
const seed = (
  i: number,
  name: string,
  url: string,
  color: string,
  initial: string,
  size: 'large' | 'small',
  openedMinutesAgo: number | null,
): FakeTile => ({
  id: `tile-${i}`,
  name,
  url,
  description: size === 'large' ? `${name} for the team.` : null,
  color,
  initial,
  category: null,
  lastOpenedAt: openedMinutesAgo === null ? null : new Date(NOW - openedMinutesAgo * 60_000).toISOString(),
  createdAt: new Date(NOW - 86_400_000 + i * 1000).toISOString(),
  x: 0,
  y: 0,
  cols: size === 'large' ? 4 : 3,
  rows: size === 'large' ? 3 : 2,
});

/** Eleven apps: three large tiles, then eight compact ones, packed onto the grid. */
export const DEFAULT_TILES: FakeTile[] = pack([
  seed(0, 'Northwind Billing', 'https://billing.northwind.example', '#2563EB', 'NB', 'large', 8),
  seed(1, 'Atlas Admin', 'https://atlas.northwind.example', '#CF3B20', 'AA', 'large', 120),
  seed(2, 'Hearth HR', 'https://hr.northwind.example', '#1B6B3C', 'HH', 'large', null),
  seed(3, 'Statuspage', 'https://status.northwind.example', '#0F766E', 'S', 'small', null),
  seed(4, 'Ledger', 'https://ledger.northwind.example', '#6D28D9', 'L', 'small', null),
  seed(5, 'Docs', 'https://docs.northwind.example', '#17181C', 'D', 'small', null),
  seed(6, 'Metrics', 'https://metrics.northwind.example', '#A15F00', 'M', 'small', null),
  seed(7, 'Support Desk', 'https://support.northwind.example', '#BE185D', 'SD', 'small', null),
  seed(8, 'Wiki', 'https://wiki.northwind.example', '#2563EB', 'W', 'small', null),
  seed(9, 'Deploys', 'https://deploys.northwind.example', '#1B6B3C', 'DP', 'small', null),
  seed(10, 'Payroll', 'https://payroll.northwind.example', '#CF3B20', 'P', 'small', null),
]);

const ME = {
  name: 'Maya Okafor',
  email: 'maya@northwind.example',
  initials: 'MO',
  workspace: 'Northwind',
  signInMethod: 'SSO',
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/**
 * Answers /api/auth/me and /api/tiles in the browser from an in-memory list, with the same contract as the
 * .NET API. Used when E2E_FAKE_API is set, and by tests that need a state the seed data does not hold.
 */
export async function installFakeApi(page: Page, initial: FakeTile[] = DEFAULT_TILES): Promise<void> {
  let tiles = initial.map((t) => ({ ...t }));
  let nextId = 100;
  const ordered = () => [...tiles].sort((a, b) => a.y - b.y || a.x - b.x);

  await page.route('**/api/auth/me', (route) => json(route, ME));
  await page.route(/\/api\/tiles(\/.*)?$/, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^\/api\/tiles\/?/, '');
    const method = request.method();
    const body = () => request.postDataJSON() ?? {};

    if (path === '' && method === 'GET') return json(route, ordered());
    if (path === '' && method === 'POST') {
      const spot = pack([...tiles, { cols: 3, rows: 2 } as FakeTile]).at(-1)!;
      const tile: FakeTile = {
        description: null,
        category: null,
        lastOpenedAt: null,
        ...body(),
        id: `tile-${nextId++}`,
        createdAt: new Date(NOW).toISOString(),
        x: spot.x,
        y: spot.y,
        cols: 3,
        rows: 2,
      };
      tiles.push(tile);
      return json(route, tile, 201);
    }
    if (path === 'layout' && method === 'PUT') {
      const placements: { id: string; x: number; y: number; cols: number; rows: number }[] = body().tiles;
      for (const p of placements) Object.assign(tiles.find((t) => t.id === p.id) ?? {}, p);
      return json(route, ordered());
    }
    if (path === 'reset-layout' && method === 'POST') {
      tiles = pack(
        [...tiles].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name)),
        true,
      );
      return json(route, ordered());
    }
    const [id, action] = path.split('/');
    const tile = tiles.find((t) => t.id === id);
    if (!tile) return json(route, { status: 404, title: 'Not found' }, 404);
    if (action === 'opened' && method === 'POST') {
      tile.lastOpenedAt = new Date(NOW).toISOString();
      return json(route, tile);
    }
    if (!action && method === 'GET') return json(route, tile);
    if (!action && method === 'PUT') {
      Object.assign(tile, body());
      return json(route, tile);
    }
    if (!action && method === 'DELETE') {
      tiles = tiles.filter((t) => t.id !== id);
      return route.fulfill({ status: 204 });
    }
    return route.fallback();
  });
}

/** Answers GET /api/tiles with these tiles (the rest of the fake API keeps working). */
export async function stubTiles(page: Page, tiles: FakeTile[]): Promise<void> {
  await installFakeApi(page, tiles);
}

/** Delays every GET /api/tiles response by `ms` before it reaches the page. */
export async function slowTiles(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/tiles',
    guarded(page, async (route) => {
      if (route.request().method() === 'GET') await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fallback();
    }),
  );
}

/** Makes GET /api/tiles fail with a 500 until the returned function is called. */
export async function failTiles(page: Page): Promise<() => Promise<void>> {
  const handler = (route: Route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: JSON.stringify({ status: 500, title: 'Something went wrong on our side.' }),
        })
      : route.fallback();
  await page.route('**/api/tiles', handler);
  return () => page.unroute('**/api/tiles', handler);
}
