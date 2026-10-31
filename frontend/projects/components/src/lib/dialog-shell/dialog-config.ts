import { DialogConfig } from '@angular/cdk/dialog';
import { Overlay, OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { Provider } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDialogConfig = DialogConfig<any, any>;

/** CDK Dialog settings for a centred modal with the ingresso backdrop. */
export function modalDialogConfig<C extends AnyDialogConfig>(overrides: C = {} as C): C {
  return {
    backdropClass: 'ig-dialog-backdrop',
    panelClass: 'ig-dialog-pane',
    width: 'calc(100vw - 3rem)',
    maxWidth: '32rem',
    ...overrides,
  };
}

/** CDK Dialog settings for a bottom sheet: docked to the bottom edge and full width on phones. */
export function sheetDialogConfig<C extends AnyDialogConfig>(overlay: Overlay, overrides: C = {} as C): C {
  return {
    backdropClass: 'ig-dialog-backdrop',
    panelClass: ['ig-dialog-pane', 'ig-dialog-pane--sheet'],
    positionStrategy: overlay.position().global().centerHorizontally().bottom('0'),
    width: '100%',
    maxWidth: '32rem',
    ...overrides,
  };
}

/**
 * Renders CDK overlays in the overlay container instead of the browser's top layer, so the ingresso z-order applies
 * and toasts (`--ig-z-toast`) stay above an open dialog (`--ig-z-modal`).
 */
export function provideIngressoOverlays(): Provider {
  return { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } };
}
