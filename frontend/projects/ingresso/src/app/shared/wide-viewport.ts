import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TileGrid } from 'components';
import { map } from 'rxjs';

/** Whether the window is wide enough for the 12-column grid and edit mode (L2-042, L2-054). */
export function injectWideViewport(): Signal<boolean> {
  return toSignal(
    inject(BreakpointObserver)
      .observe(`(min-width: ${TileGrid.minimumGridWidth}px)`)
      .pipe(map((state) => state.matches)),
    { initialValue: true },
  );
}
