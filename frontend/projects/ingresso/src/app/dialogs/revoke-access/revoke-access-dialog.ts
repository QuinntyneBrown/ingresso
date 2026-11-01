import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, ElementRef, inject, Injector, signal } from '@angular/core';
import { ConnectedApp, CONNECTED_APPS_API } from 'api';
import { Alert, Button, DialogShell } from 'components';
import { revealAlert } from '../../shared/reveal-alert';
import { scopePhrase } from '../../shared/scope-phrase';

export const REVOKE_ACCESS_TITLE_ID = 'ig-revoke-access-title';

/** "Revoke <app>'s access?": asks, then revokes the app's access and closes with true (L2-129). */
@Component({
  selector: 'ig-revoke-access-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell [title]="'Revoke ' + app.name + '’s access?'" [titleId]="titleId">
      <p slot="description" class="description">It won’t be able to {{ loses }}.</p>
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn’t revoke access">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <p>
          {{ app.name }} is signed out wherever it holds your sign-in. Next time you sign in to it, ingresso
          asks you again.
        </p>
      </div>
      <button slot="footer" ig-button type="button" [disabled]="busy()" (click)="ref.close()">Cancel</button>
      <button slot="footer" ig-button appearance="danger" type="button" [busy]="busy()" (click)="revoke()">
        {{ busy() ? 'Revoking…' : 'Revoke access' }}
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
export class RevokeAccessDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly app = inject<ConnectedApp>(DIALOG_DATA);
  private readonly api = inject(CONNECTED_APPS_API);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly titleId = REVOKE_ACCESS_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  /** "see your display name or email address, use Sample API for you, or stay signed in". */
  protected readonly loses = scopePhrase(
    this.app.scopes.map((s) => s.title.replace(' when you’re not using it', '')),
    'or',
  );

  protected revoke(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    this.api.revoke(this.app.clientId).subscribe({
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
