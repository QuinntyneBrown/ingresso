// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
import { TileGridItem } from './grid-tile';

/**
 * The name assistive technology reads for a tile.
 *
 * A label is trimmed before it is judged usable, so a label of spaces falls back to the id
 * exactly as a missing one does — an operator who hears nothing cannot tell an unnamed tile
 * from a tile that is not there.
 */
export function accessibleNameOf(tile: TileGridItem): string {
  const label = typeof tile.label === 'string' ? tile.label.trim() : '';
  return label === '' ? tile.id : label;
}
