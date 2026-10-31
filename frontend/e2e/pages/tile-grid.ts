import { Locator, Page } from '@playwright/test';

export interface Placement {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/** The dashboard's `ig-tile-grid`: tile placement, keyboard and pointer gestures, and announcements. */
export class TileGrid {
  readonly root: Locator;
  readonly shadow: Locator;
  readonly announcer: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('ig-tile-grid');
    this.shadow = this.root.locator('[data-ig-shadow]');
    this.announcer = this.root.locator('[data-ig-announcer]');
  }

  /** The grid cell holding the named app. */
  item(name: string): Locator {
    return this.root.getByRole('listitem', { name, exact: true });
  }

  /** Whether the grid shows saved cells (wide) or the reading-order flow list (narrow). */
  async isCollapsed(): Promise<boolean> {
    return (await this.root.getAttribute('data-collapsed')) !== null;
  }

  async isEditable(): Promise<boolean> {
    return (await this.root.getAttribute('data-mode')) === 'edit';
  }

  /** The named tile's column, row and span, from the cell it is drawn in. */
  async placement(name: string): Promise<Placement> {
    return this.item(name).evaluate((el) => {
      const style = (el as HTMLElement).style;
      const read = (property: string) => Number(style.getPropertyValue(property));
      return {
        x: read('--ig-tile-x'),
        y: read('--ig-tile-y'),
        cols: read('--ig-tile-cols'),
        rows: read('--ig-tile-rows'),
      };
    });
  }

  /** Every tile's name and cells, in reading order (top row first, then left to right). */
  async layout(): Promise<(Placement & { name: string })[]> {
    const names = await this.root
      .getByRole('listitem')
      .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label') ?? ''));
    const cells = await Promise.all(names.map(async (name) => ({ name, ...(await this.placement(name)) })));
    return cells.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  /** The first row below every tile, where nothing is placed yet. */
  async firstEmptyRow(): Promise<number> {
    return Math.max(0, ...(await this.layout()).map((cell) => cell.y + cell.rows));
  }

  /** Every announcement currently in the polite live regions, joined. */
  async announcement(): Promise<string> {
    return (await this.announcer.allInnerTexts()).join(' ').trim();
  }

  /** Focuses the named tile and presses a key on it, e.g. 'ArrowDown' or 'Shift+ArrowRight'. */
  async press(name: string, key: string): Promise<void> {
    await this.item(name).focus();
    await this.page.keyboard.press(key);
  }

  /** The width of one column plus its gap, and the height of one row plus its gap, in pixels. */
  private async pitch(): Promise<{ column: number; row: number }> {
    return this.root.evaluate((el) => {
      const style = getComputedStyle(el);
      const px = (property: string) => parseFloat(style.getPropertyValue(property));
      const gap = px('--ig-tile-grid-gap');
      return { column: px('--ig-tile-grid-column-width') + gap, row: px('--ig-tile-grid-row-height') + gap };
    });
  }

  /** Drags the named tile by whole cells with the mouse, as a person would. */
  async drag(name: string, columns: number, rows: number): Promise<void> {
    await this.item(name).scrollIntoViewIfNeeded();
    const box = await this.item(name).boundingBox();
    if (!box) throw new Error(`${name} must be visible to drag`);
    const pitch = await this.pitch();
    const start = { x: box.x + 24, y: box.y + 24 };
    const mouse = this.page.mouse;
    await mouse.move(start.x, start.y);
    await mouse.down();
    await mouse.move(start.x + 8, start.y + 8, { steps: 4 });
    await mouse.move(start.x + columns * pitch.column, start.y + rows * pitch.row, { steps: 20 });
    await mouse.up();
  }

  /** Drags the named tile's corner handle by whole cells. */
  async resize(name: string, columns: number, rows: number): Promise<void> {
    const handle = this.item(name).locator('[data-ig-handle]');
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    if (!box) throw new Error(`${name} must be in edit mode to resize`);
    const pitch = await this.pitch();
    const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const mouse = this.page.mouse;
    await mouse.move(start.x, start.y);
    await mouse.down();
    await mouse.move(start.x + 4, start.y + 4, { steps: 2 });
    await mouse.move(start.x + columns * pitch.column, start.y + rows * pitch.row, { steps: 20 });
    await mouse.up();
  }

  /** Starts dragging the named tile by whole cells and holds it there, to look at the shadow before dropping. */
  async holdDrag(name: string, columns: number, rows: number): Promise<void> {
    await this.item(name).scrollIntoViewIfNeeded();
    const box = await this.item(name).boundingBox();
    if (!box) throw new Error(`${name} must be visible to drag`);
    const pitch = await this.pitch();
    const start = { x: box.x + 24, y: box.y + 24 };
    const mouse = this.page.mouse;
    await mouse.move(start.x, start.y);
    await mouse.down();
    await mouse.move(start.x + 8, start.y + 8, { steps: 4 });
    await mouse.move(start.x + columns * pitch.column, start.y + rows * pitch.row, { steps: 20 });
  }

  async drop(): Promise<void> {
    await this.page.mouse.up();
  }

  /** Whether the drag shadow is showing, and whether it says the drop is allowed. */
  async shadowState(): Promise<'none' | 'valid' | 'refused'> {
    if ((await this.shadow.count()) === 0) return 'none';
    return (await this.shadow.getAttribute('data-valid')) === 'true' ? 'valid' : 'refused';
  }

  /** The key instructions a screen reader reads for the named tile. */
  async instructions(name: string): Promise<string> {
    return this.item(name).evaluate((el) => {
      const id = el.getAttribute('aria-describedby');
      return (id ? document.getElementById(id)?.textContent : '')?.trim() ?? '';
    });
  }

  /** Presses a key on the named tile and returns how many milliseconds passed before the tile's cell changed. */
  async millisecondsToMove(name: string, key: string): Promise<number> {
    const tile = this.item(name);
    await tile.focus();
    // Watch from inside the page, and start the clock at the key event itself, so the figure is the time the
    // page took to redraw and not the time the test took to send the key.
    await tile.evaluate((el) => {
      const watched = el as HTMLElement & { __moved?: Promise<number> };
      watched.__moved = new Promise<number>((resolve) => {
        el.addEventListener(
          'keydown',
          () => {
            const started = performance.now();
            new MutationObserver((_records, observer) => {
              observer.disconnect();
              resolve(performance.now() - started);
            }).observe(el, { attributes: true, attributeFilter: ['style'] });
          },
          { capture: true, once: true },
        );
      });
    });
    await this.page.keyboard.press(key);
    return tile.evaluate((el) => (el as HTMLElement & { __moved: Promise<number> }).__moved);
  }

  /** The first cell, in reading order, where a tile of this span fits without touching another. */
  async firstFreeCell(cols = 3, rows = 2, columns = 12): Promise<{ x: number; y: number }> {
    const cells = await this.layout();
    const free = (x: number, y: number) =>
      cells.every((c) => x >= c.x + c.cols || c.x >= x + cols || y >= c.y + c.rows || c.y >= y + rows);
    for (let y = 0; ; y++) {
      for (let x = 0; x + cols <= columns; x++) if (free(x, y)) return { x, y };
    }
  }
}
