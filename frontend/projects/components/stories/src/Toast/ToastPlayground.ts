import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../../../src/lib/button/button';
import { ToastRegion } from '../../../src/lib/toast/toast-region';
import { ToastKind, ToastOptions, ToastService } from '../../../src/lib/toast/toast.service';

const SAMPLES: Record<ToastKind, ToastOptions> = {
  success: {
    kind: 'success',
    title: 'App added',
    text: 'Northwind Billing is on your dashboard.',
  },
  info: {
    kind: 'info',
    title: 'Layout reset',
    text: 'Tiles are back in their default order.',
    action: { label: 'Undo', run: () => undefined },
  },
  warning: {
    kind: 'warning',
    title: 'Saving is slow',
    text: 'Your app is saved; the icon finishes shortly.',
  },
  danger: {
    kind: 'danger',
    title: "Couldn't copy the link",
    text: 'Select the link and copy it manually.',
    action: { label: 'Try again', run: () => undefined },
  },
};

/** Story-only host that raises sample toasts through ToastService. */
@Component({
  selector: 'ig-toast-playground',
  imports: [Button, ToastRegion],
  template: `
    <div class="cluster">
      @for (kind of kinds; track kind) {
        <button ig-button type="button" (click)="show(kind)">Show {{ kind }}</button>
      }
    </div>
    <ig-toast-region />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPlayground {
  private readonly toasts = inject(ToastService);
  protected readonly kinds: ToastKind[] = ['info', 'success', 'warning', 'danger'];

  protected show(kind: ToastKind): void {
    this.toasts.show(SAMPLES[kind]);
  }
}
