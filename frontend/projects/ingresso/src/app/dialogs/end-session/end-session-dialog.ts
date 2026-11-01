import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Injector, signal } from '@angular/core';
import { Device, SESSIONS_API } from 'api';
import { Alert, Button, DialogShell } from 'components';
import { revealAlert } from '../../shared/reveal-alert';

export const END_SESSION_TITLE_ID = 'ig-end-session-title';

/** "a", "a and b", "a, b and c". */
function joined(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** What the dialog ends: one other device, or all of them. */
export interface EndSessionData {
  device: Device | 'others';
  others: Device[];
}

/**
 * "End the session on <device>?" or "Sign out of all other devices?": asks, then ends the session (or every other
 * one) and closes with true (L2-133, L2-134).
 */
@Component({
  selector: 'ig-end-session-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell [title]="title" [titleId]="titleId">
      <p slot="description" class="description">
        {{ description }}
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
        {{ busy() ? 'Ending…' : action }}
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
  private readonly data = inject<EndSessionData>(DIALOG_DATA);
  private readonly api = inject(SESSIONS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = END_SESSION_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  private readonly ending = this.data.device === 'others' ? this.data.others : [this.data.device];
  protected readonly title =
    this.data.device === 'others'
      ? 'Sign out of all other devices?'
      : `End the session on ${this.data.device.device}?`;
  protected readonly action = this.data.device === 'others' ? 'Sign out other devices' : 'End session';
  protected readonly description = `${joined(this.ending.map((d) => d.device))} ${
    this.ending.length > 1 ? 'are' : 'is'
  } signed out of ingresso straight away.`;

  protected end(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    const { device } = this.data;
    (device === 'others' ? this.api.endOthers() : this.api.end(device.id)).subscribe({
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
