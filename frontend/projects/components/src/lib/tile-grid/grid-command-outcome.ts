// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
/**
 * What a run of keyboard commands came to.
 *
 * The reason is carried rather than reduced to a boolean, because the sentence an operator
 * hears differs by reason, and a composer handed only `false` would have to infer one from
 * the cell it was given.
 */
export type GridCommandOutcome = 'accepted' | 'blocked-occupied' | 'blocked-bounds' | 'blocked-limit';
