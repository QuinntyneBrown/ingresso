// Ported from qbc-grid (https://github.com/QuinntyneBrown/qbc-grid).
// Copyright (c) 2026 Quinntyne Brown and qbc-grid contributors. MIT License.
import { Directive, TemplateRef, inject } from '@angular/core';

import { TileGridItemContext } from './grid-tile-context';

/**
 * Marks the template a grid instantiates once per tile. The tile record reaches the
 * template as the implicit context value.
 */
@Directive({
  selector: '[igTileGridTile]',
})
export class TileGridTile {
  readonly templateRef = inject<TemplateRef<TileGridItemContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: TileGridTile,
    _context: unknown,
  ): _context is TileGridItemContext {
    return true;
  }
}
