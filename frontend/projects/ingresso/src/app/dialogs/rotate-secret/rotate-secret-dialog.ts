import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Injector, signal } from '@angular/core';
import { AppRegistered, CLIENTS_API, RegisteredApp } from 'api';
import { Alert, Button, DialogShell } from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const ROTATE_SECRET_TITLE_ID = 'ig-rotate-secret-title';

/** "Rotate <name>'s secret?": asks, then replaces a confidential app's secret and closes with the new one (L2-113). */
@Component({
  selector: 'ig-rotate-secret-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell [title]="'Rotate ' + app.name + '’s secret?'" [titleId]="titleId">
      <p slot="description" class="description">{{ app.name }}’s current secret stops working at once.</p>
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t rotate the secret">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <p>
          You’ll see the new secret once. Put it in {{ app.name }}’s settings straight away, or it won’t be
          able to sign anyone in.
        </p>
      </div>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="danger" type="button" [busy]="busy()" (click)="rotate()">
        {{ busy() ? 'Rotating…' : 'Rotate secret' }}
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
export class RotateSecretDialog {
  protected readonly ref = inject<DialogRef<AppRegistered>>(DialogRef);
  protected readonly app = inject<RegisteredApp>(DIALOG_DATA);
  private readonly clients = inject(CLIENTS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = ROTATE_SECRET_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected rotate(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    this.clients.rotateSecret(this.app.clientId).subscribe({
      next: (rotated) => this.ref.close(rotated),
      error: () => {
        this.busy.set(false);
        this.ref.disableClose = false;
        this.failed.set(true);
        revealAlert(this.host, this.injector);
      },
    });
  }
}
