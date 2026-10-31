import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiError, Tile, TileInput } from 'api';
import { Alert, Button, DialogShell, ToastService } from 'components';
import { TilesStore } from '../../state/tiles-store';
import { AppForm, APP_FORM_ID } from '../app-form/app-form';

export const EDIT_APP_TITLE_ID = 'ig-edit-app-title';

export interface EditAppDialogData {
  tile: Tile;
}

/** What the dialog closed with. */
export type EditAppOutcome = { kind: 'saved'; tile: Tile } | { kind: 'deleted'; id: string };

/** "Edit app": the app form with Save changes, Cancel and Delete (which asks first). */
@Component({
  selector: 'ig-edit-app-dialog',
  imports: [Alert, AppForm, Button, DialogShell],
  template: `
    <ig-dialog-shell title="Edit app" [titleId]="titleId">
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn't save that"
            >Try again in a moment.</ig-alert
          >
        }
        @if (confirming()) {
          <ig-alert kind="warning" announce="alert" title="Delete {{ data.tile.name }}?">
            The tile is removed from your dashboard. The app itself is not touched.
          </ig-alert>
        }
        <ig-app-form
          [value]="initial()"
          [errors]="fieldErrors()"
          [disabled]="busy()"
          (submitted)="save($event)"
        />
      </div>
      @if (confirming()) {
        <ng-container slot="footer">
          <button ig-button type="button" [disabled]="busy()" (click)="confirming.set(false)">
            Keep app
          </button>
          <button ig-button appearance="danger" type="button" [busy]="busy()" (click)="remove()">
            Delete app
          </button>
        </ng-container>
      } @else {
        <ng-container slot="footer">
          <button
            ig-button
            appearance="ghost"
            type="button"
            [disabled]="busy()"
            (click)="confirming.set(true)"
          >
            Delete
          </button>
          <button ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
          <button ig-button appearance="primary" type="submit" [attr.form]="formId" [busy]="busy()">
            Save changes
          </button>
        </ng-container>
      }
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
export class EditAppDialog {
  protected readonly ref = inject<DialogRef<EditAppOutcome>>(DialogRef);
  protected readonly data = inject<EditAppDialogData>(DIALOG_DATA);
  private readonly store = inject(TilesStore);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = EDIT_APP_TITLE_ID;
  protected readonly formId = APP_FORM_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly confirming = signal(false);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly initial = computed<Partial<TileInput>>(() => this.data.tile);

  protected save(input: TileInput): void {
    this.start();
    this.store.update(this.data.tile.id, input).subscribe({
      next: (tile) => {
        this.toasts.show({ kind: 'success', title: 'Changes saved', text: `${tile.name} was updated.` });
        this.ref.close({ kind: 'saved', tile });
      },
      error: (error: unknown) => {
        this.stop();
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

  protected remove(): void {
    this.start();
    this.store.remove(this.data.tile.id).subscribe({
      next: () => {
        this.toasts.show({
          kind: 'success',
          title: 'App deleted',
          text: `${this.data.tile.name} was removed.`,
        });
        this.ref.close({ kind: 'deleted', id: this.data.tile.id });
      },
      error: () => {
        this.stop();
        this.confirming.set(false);
        this.failed.set(true);
      },
    });
  }

  private start(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.fieldErrors.set({});
    this.ref.disableClose = true;
  }

  private stop(): void {
    this.busy.set(false);
    this.ref.disableClose = false;
  }
}
