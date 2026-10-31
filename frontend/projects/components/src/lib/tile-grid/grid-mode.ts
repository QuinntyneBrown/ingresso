// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * The two states a grid can be in. `live` is inert: it presents no affordance and
 * refuses every gesture. `edit` allows an unlocked tile to be moved and resized.
 */
export type TileGridMode = 'live' | 'edit';
