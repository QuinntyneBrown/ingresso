// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * Everything a gesture needs to convert a pointer position into a cell, measured once at
 * gesture start so no pointer event reads the DOM.
 */
export interface GridGestureCache {
  gridLeft: number;
  gridTop: number;
  columnWidth: number;
  rowHeight: number;
  gap: number;
  columns: number;
  grabOffsetX: number;
  grabOffsetY: number;
}
