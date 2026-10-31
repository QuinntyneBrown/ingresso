import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Alert, Button, DialogShell, ToastService } from 'components';
import { TilesStore } from '../../state/tiles-store';

export const RESET_LAYOUT_TITLE_ID = 'ig-reset-layout-title';

/** "Reset the layout?": asks before every tile returns to the default layout (L2-019). */
@Component({
  selector: 'ig-reset-layout-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell title="Reset the layout?" [titleId]="titleId">
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn't reset the layout"
            >Try again in a moment.</ig-alert
          >
        }
        <p>
          Every tile goes back to its default position and size, in the order you added them. No tile is
          deleted or edited.
        </p>
      </div>
      <ng-container slot="footer">
        <button ig-button type="button" [disabled]="busy()" (click)="ref.close()">Keep my layout</button>
        <button ig-button appearance="primary" type="button" [busy]="busy()" (click)="reset()">
          Reset layout
        </button>
      </ng-container>
    </ig-dialog-shell>
  `,
  styles: `
    .body {
      display: grid;
      gap: var(--spacingVerticalL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetLayoutDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly store = inject(TilesStore);
  private readonly toasts = inject(ToastService);
  protected readonly titleId = RESET_LAYOUT_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected reset(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.store.resetLayout().subscribe({
      next: () => {
        this.toasts.show({
          kind: 'success',
          title: 'Layout reset',
          text: 'Tiles are back in their default positions.',
        });
        this.ref.close(true);
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }
}
