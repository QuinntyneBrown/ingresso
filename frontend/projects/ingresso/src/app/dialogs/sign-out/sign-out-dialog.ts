import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alert, Button, DialogShell } from 'components';
import { SessionStore } from '../../state/session-store';

export const SIGN_OUT_TITLE_ID = 'ig-sign-out-title';

/** "Sign out of ingresso?": confirms, ends the session on the server and lands on sign-in (L2-031). */
@Component({
  selector: 'ig-sign-out-dialog',
  imports: [Alert, Button, DialogShell],
  template: `
    <ig-dialog-shell title="Sign out of ingresso?" [titleId]="titleId">
      <div class="body">
        @if (failed()) {
          <ig-alert kind="danger" announce="alert" title="We couldn't sign you out"
            >You are still signed in. Try again in a moment.</ig-alert
          >
        }
        <p>Your tiles stay saved. You'll sign in again with an emailed link next time.</p>
        @if (session.user(); as user) {
          <p class="who">Signed in as {{ user.name }} · {{ user.email }}</p>
        }
      </div>
      <ng-container slot="footer">
        <button ig-button type="button" [disabled]="busy()" (click)="ref.close()">Stay signed in</button>
        <button
          ig-button
          appearance="primary"
          type="button"
          [busy]="busy()"
          [disabled]="busy()"
          (click)="signOut()"
        >
          {{ busy() ? 'Signing out…' : 'Sign out' }}
        </button>
      </ng-container>
    </ig-dialog-shell>
  `,
  styles: `
    .body {
      display: grid;
      gap: var(--spacingVerticalM);
    }
    .who {
      color: var(--colorNeutralForeground3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignOutDialog {
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  protected readonly titleId = SIGN_OUT_TITLE_ID;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected signOut(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.session.signOut().subscribe({
      next: () => {
        this.ref.close();
        void this.router.navigateByUrl('/sign-in');
      },
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }
}
