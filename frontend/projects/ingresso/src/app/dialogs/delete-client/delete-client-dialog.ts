import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Injector, signal } from '@angular/core';
import { CLIENTS_API, RegisteredApp } from 'api';
import { Alert, Button, DialogShell, FormField, Input } from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const DELETE_CLIENT_TITLE_ID = 'ig-delete-client-title';

/** "Delete <name>?": deletes a registered app and its tokens once its name is typed to confirm (L2-115). */
@Component({
  selector: 'ig-delete-client-dialog',
  imports: [Alert, Button, DialogShell, FormField, Input],
  template: `
    <ig-dialog-shell [title]="'Delete ' + app.name + '?'" [titleId]="titleId">
      <p slot="description" class="description">
        {{ app.name }} will no longer sign anyone in with ingresso.
      </p>
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t delete the app">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <p>
          Every token {{ app.name }} holds stops working, so people signed in to it are signed out the next
          time it checks. This can’t be undone.
        </p>
        <ig-form-field [label]="'Type ' + app.name + ' to confirm'" controlId="delete-client-name">
          <input
            ig-input
            id="delete-client-name"
            autocomplete="off"
            [value]="typed()"
            [disabled]="busy()"
            (input)="typed.set($any($event.target).value)"
          />
        </ig-form-field>
      </div>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button
        slot="footer"
        ig-button
        appearance="danger"
        type="button"
        [busy]="busy()"
        [disabled]="typed() !== app.name"
        (click)="remove()"
      >
        {{ busy() ? 'Deleting…' : 'Delete app' }}
      </button>
    </ig-dialog-shell>
  `,
  styles: `
    .description {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
    .body {
      display: grid;
      gap: var(--spacingVerticalL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteClientDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly app = inject<RegisteredApp>(DIALOG_DATA);
  private readonly clients = inject(CLIENTS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = DELETE_CLIENT_TITLE_ID;
  protected readonly typed = signal('');
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected remove(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    this.clients.remove(this.app.clientId).subscribe({
      next: () => this.ref.close(true),
      error: () => {
        this.busy.set(false);
        this.ref.disableClose = false;
        this.failed.set(true);
        revealAlert(this.host, this.injector);
      },
    });
  }
}
