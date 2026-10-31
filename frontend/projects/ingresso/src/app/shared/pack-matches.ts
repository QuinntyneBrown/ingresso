/** A rectangle of grid cells. */
export interface Cell {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/**
 * Closes matches up while a search is active: each tile, in the order given, takes the first free spot in reading
 * order at its own span. Nothing is saved, so clearing the search brings the saved layout back.
 */
export function packMatches<T extends Cell>(tiles: readonly T[], columns = 12): T[] {
  const placed: T[] = [];
  const free = (x: number, y: number, cols: number, rows: number) =>
    placed.every((t) => x >= t.x + t.cols || t.x >= x + cols || y >= t.y + t.rows || t.y >= y + rows);
  for (const tile of tiles) {
    const cols = Math.min(tile.cols, columns);
    let spot: [number, number] | null = null;
    for (let y = 0; spot === null; y++) {
      for (let x = 0; x + cols <= columns && spot === null; x++) {
        if (free(x, y, cols, tile.rows)) spot = [x, y];
      }
    }
    placed.push({ ...tile, x: spot[0], y: spot[1], cols });
  }
  return placed;
}
