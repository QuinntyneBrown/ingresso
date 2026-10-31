import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiError, Tile, TileInput } from 'api';
import { Alert, Button, DialogShell, ToastService } from 'components';
import { TilesStore } from '../../state/tiles-store';
import { AppForm, APP_FORM_ID } from '../app-form/app-form';

export const ADD_APP_TITLE_ID = 'ig-add-app-title';

/** Optional starting values, such as an app picked from the directory. */
export interface AddAppDialogData {
  prefill?: Partial<TileInput>;
}

/** "Add an app": the app form with Cancel and Add app; closes with the created tile. */
@Component({
  selector: 'ig-add-app-dialog',
  imports: [Alert, AppForm, Button, DialogShell],
  template: `
    <ig-dialog-shell title="Add an app" [titleId]="titleId">
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn't add that app">
            Check the details and try again.
          </ig-alert>
        }
        <ig-app-form
          [value]="data?.prefill ?? null"
          [errors]="fieldErrors()"
          [disabled]="busy()"
          (submitted)="add($event)"
        />
      </div>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="primary" type="submit" [attr.form]="formId" [busy]="busy()">
        Add app
      </button>
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
export class AddAppDialog {
  protected readonly ref = inject<DialogRef<Tile>>(DialogRef);
  protected readonly data = inject<AddAppDialogData | null>(DIALOG_DATA, { optional: true });
  private readonly store = inject(TilesStore);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = ADD_APP_TITLE_ID;
  protected readonly formId = APP_FORM_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected add(input: TileInput): void {
    this.busy.set(true);
    this.failed.set(false);
    this.fieldErrors.set({});
    this.ref.disableClose = true;
    this.store.create(input).subscribe({
      next: (tile) => {
        this.toasts.show({ kind: 'success', title: 'App added', text: `${tile.name} is on your dashboard.` });
        this.ref.close(tile);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.ref.disableClose = false;
        if (
          error instanceof ApiError &&
          error.kind === 'Validation' &&
          Object.keys(error.fieldErrors).length
        ) {
          this.fieldErrors.set(
            Object.fromEntries(Object.entries(error.fieldErrors).map(([k, v]) => [k.toLowerCase(), v[0]])),
          );
        } else {
          this.failed.set(true);
        }
      },
    });
  }
}
