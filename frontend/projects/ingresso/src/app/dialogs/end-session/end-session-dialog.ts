import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Injector, signal } from '@angular/core';
import { Device, SESSIONS_API } from 'api';
import { Alert, Button, DialogShell } from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const END_SESSION_TITLE_ID = 'ig-end-session-title';

/** "End the session on <device>?": asks, then ends another device's session and closes with true (L2-133). */
@Component({
  selector: 'ig-end-session-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell [title]="'End the session on ' + device.device + '?'" [titleId]="titleId">
      <p slot="description" class="description">
        {{ device.device }} is signed out of ingresso straight away.
      </p>
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t end the session">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <p>Apps you signed in to there have to sign in again. This device stays signed in.</p>
      </div>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="danger" type="button" [busy]="busy()" (click)="end()">
        {{ busy() ? 'Ending…' : 'End session' }}
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
export class EndSessionDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly device = inject<Device>(DIALOG_DATA);
  private readonly api = inject(SESSIONS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = END_SESSION_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected end(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    this.api.end(this.device.id).subscribe({
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
