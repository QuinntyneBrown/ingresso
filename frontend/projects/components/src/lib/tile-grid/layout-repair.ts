// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
import { TileGridItem } from './grid-tile';

/**
 * The result of normalizing a supplied layout: the records the grid will render, and
 * whether producing them changed anything.
 */
export interface LayoutRepair {
  tiles: readonly TileGridItem[];
  repaired: boolean;
}
