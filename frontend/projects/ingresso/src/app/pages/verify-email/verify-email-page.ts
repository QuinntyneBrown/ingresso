import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError, AUTH_API } from 'api';
import { Alert, AlertKind, Button, SkipLink } from 'components';
import { AuthLayout } from '../../shared/auth-layout';
import { SessionStore } from '../../state/session-store';

interface Notice {
  kind: AlertKind;
  title: string;
  announce: 'status' | 'alert';
}

/** Why an unverified account sees this screen, and how to get another verification email (L2-029). */
@Component({
  selector: 'ig-verify-email-page',
  imports: [Alert, AuthLayout, Button, SkipLink],
  template: `
    <ig-skip-link target="main" />
    <ig-auth-layout>
      <div>
        <h1 class="auth-card__title">Verify your email</h1>
        <p class="auth-card__lead">
          We sent a link to {{ session.user()?.email }}. Open it to start using ingresso. Until then your apps
          stay hidden.
        </p>
      </div>
      @if (notice(); as n) {
        <ig-alert [kind]="n.kind" [title]="n.title" [announce]="n.announce">{{ body() }}</ig-alert>
      }
      <button
        ig-button
        appearance="primary"
        type="button"
        block
        [busy]="busy()"
        [disabled]="busy()"
        (click)="send()"
      >
        {{ busy() ? 'Sending…' : 'Send another email' }}
      </button>
      <button ig-button type="button" block [disabled]="busy()" (click)="signOut()">Sign out</button>
    </ig-auth-layout>
  `,
  styles: `
    .auth-card__title {
      font: var(--ig-text-h2);
      letter-spacing: var(--ig-letter-spacing-tight);
    }
    .auth-card__lead {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  private readonly auth = inject(AUTH_API);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionStore);

  /** What the API appended after a verification link: `0` when the link did not work. */
  private readonly linkResult = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: false });

  protected readonly busy = signal(false);
  private readonly outcome = signal<'sent' | 'rate-limited' | 'failed' | null>(null);

  protected readonly notice = (): Notice | null => {
    switch (this.outcome()) {
      case 'sent':
        return { kind: 'success', title: 'Email sent', announce: 'status' };
      case 'rate-limited':
        return { kind: 'warning', title: 'Too many emails', announce: 'alert' };
      case 'failed':
        return { kind: 'danger', title: 'We couldn’t send the email', announce: 'alert' };
      default:
        return this.linkResult()?.get('email-verified') === '0'
          ? { kind: 'warning', title: 'That link didn’t work', announce: 'alert' }
          : null;
    }
  };

  protected readonly body = (): string => {
    switch (this.outcome()) {
      case 'sent':
        return `Check ${this.session.user()?.email}. The link works for 24 hours.`;
      case 'rate-limited':
        return 'You’ve asked for a few already. Wait a little while, then try again.';
      case 'failed':
        return 'Something went wrong on our side. Try again in a moment.';
      default:
        return 'It may have expired or been used. Send another email below.';
    }
  };

  constructor() {
    if (!this.session.user()) this.session.load();
    // A verified account has no reason to be here.
    effect(() => {
      if (this.session.user()?.emailVerified) void this.router.navigateByUrl('/');
    });
  }

  protected send(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.outcome.set(null);
    this.auth.resendVerification().subscribe({
      next: () => {
        this.busy.set(false);
        this.outcome.set('sent');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.outcome.set(
          error instanceof ApiError && error.kind === 'RateLimited' ? 'rate-limited' : 'failed',
        );
      },
    });
  }

  protected signOut(): void {
    this.session.signOut().subscribe({ next: () => void this.router.navigateByUrl('/sign-in') });
  }
}
