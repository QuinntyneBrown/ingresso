// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * The derived render context: the column count the grid draws, the width one column
 * occupies, the height of one row, and the gutter between cells. Column width and the
 * gap both follow from the container, so the whole record is derived together.
 */
export interface GridMetrics {
  columns: number;
  columnWidth: number;
  rowHeight: number;
  gap: number;
}
