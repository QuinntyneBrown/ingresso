import type { Journey } from '../scripts/run-journey';
import { TileGrid } from '../../pages/tile-grid';

/** Arrange tiles: edit layout, drag to free cells, resize, a refused drop, a keyboard move, and Done. */
const journey: Journey = async ({ page, shot }) => {
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'dev@ingresso.dev' } });
  if (!response.ok()) throw new Error(`Test sign-in failed: ${response.status()}`);

  // The page objects run through tsx, which wraps named functions in a helper the browser does not have.
  await page.addInitScript(() => {
    (window as unknown as { __name: (fn: unknown) => unknown }).__name = (fn) => fn;
  });
  const grid = new TileGrid(page);
  await page.goto('/');
  await page.getByText('Datadog', { exact: true }).waitFor();
  await shot('dashboard');

  await page.getByRole('button', { name: 'Edit layout' }).click();
  await page.locator('ig-tile-grid[data-mode="edit"]').waitFor();
  await shot('edit-layout-mode');

  // Drag the last tile down into the free rows under the grid, and show the shadow before dropping.
  await grid.holdDrag('Datadog', 0, 1);
  await page.waitForTimeout(400);
  await shot('dragging-to-free-cells', { keepPointer: true });
  await grid.drop();
  await page.waitForTimeout(500);

  // Resize it by its corner.
  await grid.resize('Datadog', 0, 1);
  await page.waitForTimeout(500);
  await shot('resized');

  // Try to drop it on another tile: the shadow turns to a refusal and the tile goes back.
  const target = await grid.placement('1Password');
  const own = await grid.placement('Datadog');
  await grid.holdDrag('Datadog', target.x - own.x + 1, target.y - own.y);
  await page.waitForTimeout(400);
  await shot('drop-refused', { keepPointer: true });
  await grid.drop();
  await page.waitForTimeout(500);

  // Move it with the keyboard instead.
  await grid.press('Datadog', 'ArrowUp');
  await page.waitForTimeout(500);
  await shot('moved-with-keyboard');

  await page.getByRole('button', { name: 'Done' }).first().click();
  await page.waitForTimeout(400);
  await shot('done');
};

export default journey;
