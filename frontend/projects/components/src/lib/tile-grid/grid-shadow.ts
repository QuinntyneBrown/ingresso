// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
import { GridCell } from './grid-cell';

/**
 * The rectangle drawn at the geometry a release would take. One value drives both the
 * shadow's position and its state, so the picture and the outcome cannot disagree.
 */
export interface GridShadow {
  cell: GridCell;
  valid: boolean;
}
