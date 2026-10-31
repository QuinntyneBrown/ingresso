// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * The two gestures. They differ in how the candidate cell is derived and in whether the
 * origin corner is pinned, and in nothing else, which is why one session runs both.
 */
export type GridInteractionKind = 'move' | 'resize';
