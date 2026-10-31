import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';
import { TileGrid } from './tile-grid';
import { signInAs } from '../support/session';

/** The dashboard: greeting and the grid of app tiles, with edit-layout mode. */
export class DashboardPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly summary: Locator;
  readonly tiles: Locator;
  readonly emptyTitle: Locator;
  readonly addFirstApp: Locator;
  readonly noMatches: Locator;
  readonly clearSearch: Locator;
  readonly loadFailed: Locator;
  readonly tryAgain: Locator;
  readonly layoutBar: Locator;
  readonly resetLayout: Locator;
  readonly doneInBar: Locator;
  readonly grid: TileGrid;
  readonly resetDialog: Locator;
  readonly confirmReset: Locator;
  readonly keepLayout: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.summary = page.locator('.intro p');
    this.tiles = page.locator('ig-app-tile');
    this.emptyTitle = page.getByRole('heading', { name: 'No apps behind this door yet' });
    this.addFirstApp = page.getByRole('button', { name: 'Add your first app' });
    this.noMatches = page.getByRole('heading', { name: 'No apps match that search' });
    this.clearSearch = page.getByRole('button', { name: 'Clear the search' });
    this.loadFailed = page.getByRole('alert').filter({ hasText: "We couldn't load your apps" });
    this.tryAgain = this.loadFailed.getByRole('button', { name: 'Try again' });
    this.layoutBar = page.locator('.layout-bar');
    this.resetLayout = this.layoutBar.getByRole('button', { name: 'Reset layout' });
    this.doneInBar = this.layoutBar.getByRole('button', { name: 'Done' });
    this.grid = new TileGrid(page);
    this.resetDialog = page.getByRole('dialog', { name: 'Reset the layout?' });
    this.confirmReset = this.resetDialog.getByRole('button', { name: 'Reset layout' });
    this.keepLayout = this.resetDialog.getByRole('button', { name: 'Keep my layout' });
  }

  async open(): Promise<void> {
    await signInAs(this.page);
    await this.page.goto('/');
  }

  tile(name: string): Locator {
    return this.tiles.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  largeTiles(): Locator {
    return this.page.locator('ig-app-tile .tile--large');
  }

  smallTiles(): Locator {
    return this.page.locator('ig-app-tile .tile--small');
  }

  /** Tile names in grid order. */
  async tileNames(): Promise<string[]> {
    return this.page.locator('ig-app-tile .tile__name').allInnerTexts();
  }

  /** Clicks a tile and returns the page it opens in a new tab. */
  async openApp(name: string): Promise<Page> {
    const popup = this.page.waitForEvent('popup');
    await this.tile(name).getByRole('link').click();
    return popup;
  }

  async editApp(name: string): Promise<void> {
    await this.tile(name)
      .getByRole('button', { name: `Edit ${name}` })
      .click();
  }

  /** Turns on edit mode and waits until the grid offers editing. */
  async enterEditLayout(): Promise<void> {
    await this.shell.editLayout.click();
    await this.grid.root.and(this.page.locator('[data-mode="edit"]')).waitFor();
  }

  /** The saved layout as the API returns it, to put back after a test that changes it. */
  async savedLayout(): Promise<{ id: string; x: number; y: number; cols: number; rows: number }[]> {
    const tiles: { id: string; x: number; y: number; cols: number; rows: number }[] = await (
      await this.page.request.get('/api/tiles')
    ).json();
    return tiles.map(({ id, x, y, cols, rows }) => ({ id, x, y, cols, rows }));
  }

  /** Moves every tile not named in `keep` to its own rows from `fromRow` down, through the API. */
  async parkTilesBelow(keep: string[], fromRow: number): Promise<void> {
    const tiles: { id: string; name: string; x: number; y: number; cols: number; rows: number }[] = await (
      await this.page.request.get('/api/tiles')
    ).json();
    let row = fromRow;
    await this.restoreLayout(
      tiles.map(({ id, name, x, y, cols, rows }) => {
        if (keep.includes(name)) return { id, x, y, cols, rows };
        const parked = { id, x: 0, y: row, cols, rows };
        row += rows;
        return parked;
      }),
    );
  }

  /** Saves a layout straight through the API, as the test-cleanup step after a layout test. */
  async restoreLayout(
    tiles: { id: string; x: number; y: number; cols: number; rows: number }[],
  ): Promise<void> {
    const xsrf = (await this.page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
    const response = await this.page.request.put('/api/tiles/layout', {
      data: { tiles },
      headers: { 'X-XSRF-TOKEN': xsrf },
    });
    if (!response.ok()) throw new Error(`Restoring the layout failed: ${response.status()}`);
  }
}
