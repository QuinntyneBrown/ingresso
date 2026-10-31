// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * One tile's placement on the grid, in whole cells from the origin at the top left,
 * together with the size limits and the label a host may declare for it.
 */
export interface TileGridItem {
  id: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  locked?: boolean;
  minCols?: number;
  minRows?: number;
  maxCols?: number;
  maxRows?: number;
  label?: string;
}
