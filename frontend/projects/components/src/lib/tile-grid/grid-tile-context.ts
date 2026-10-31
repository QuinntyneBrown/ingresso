// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
import { TileGridItem } from './grid-tile';

/** The context a tile template is instantiated with. */
export interface TileGridItemContext {
  $implicit: TileGridItem;
}
