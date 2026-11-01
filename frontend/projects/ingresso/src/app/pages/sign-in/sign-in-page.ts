import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError, AUTH_API } from 'api';
import { Alert, AlertKind, Button, describedBy, ErrorSummary, FormField, Input, SkipLink } from 'components';
import { AuthLayout } from '../../shared/auth-layout';

interface Notice {
  kind: AlertKind;
  title: string;
  body: string;
}

const LINK_NOTICES: Record<string, Notice> = {
  used: {
    kind: 'warning',
    title: 'That link was already used',
    body: 'Each link works once. Enter your email to get a new one.',
  },
  expired: {
    kind: 'warning',
    title: 'That link has expired',
    body: 'Links last 15 minutes. Enter your email to get a new one.',
  },
  invalid: { kind: 'danger', title: 'That link didn’t work', body: 'Enter your email to get a new one.' },
};
const RATE_LIMITED: Notice = {
  kind: 'warning',
  title: 'Too many requests',
  body: 'You’ve asked for a lot of links. Wait a few minutes, then try again.',
};
const FAILED: Notice = {
  kind: 'danger',
  title: 'We couldn’t send the link',
  body: 'Something went wrong on our side. Try again in a moment.',
};
const EMAIL_MESSAGE = 'Enter a valid email address, like maya@northwind.com';

/** The client ID of an app's authorization request, when the sign-in return address is one (L2-093). */
function clientIdOf(returnUrl: string | undefined): string | null {
  if (!returnUrl?.startsWith('/connect/authorize?')) return null;
  return new URLSearchParams(returnUrl.slice(returnUrl.indexOf('?'))).get('client_id');
}

/**
 * Sign in: ask for a single-use link by email. Opening the link in the email starts the session (L2-027, L2-028).
 * When an app sent the person here, the page names it and the link returns to the app (L2-093).
 */
@Component({
  selector: 'ig-sign-in-page',
  imports: [Alert, AuthLayout, Button, ErrorSummary, FormField, Input, ReactiveFormsModule, SkipLink],
  template: `
    <ig-skip-link target="main" />
    <ig-auth-layout>
      @if (sentTo(); as address) {
        <div>
          <h1 class="auth-card__title">Check your inbox</h1>
          <p class="auth-card__lead">
            @if (appName(); as app) {
              If {{ address }} can sign in, a link is on its way. It works once, expires in 15 minutes, and
              takes you back to {{ app }}.
            } @else {
              If {{ address }} can sign in, a link is on its way. It works once and expires in 15 minutes.
            }
          </p>
        </div>
        <ig-alert kind="success" title="Link sent" announce="status"
          >Didn’t arrive? Check your spam folder, or ask for another link.</ig-alert
        >
        <button ig-button type="button" block (click)="reset()">Use a different email</button>
      } @else {
        <div>
          @if (appName(); as app) {
            <h1 class="auth-card__title">Sign in to continue to {{ app }}</h1>
            <p class="auth-card__lead">
              {{ app }} uses your ingresso account. Enter your email and we’ll send you a link. Opening it
              takes you back to {{ app }}.
            </p>
          } @else {
            <h1 class="auth-card__title">Sign in to ingresso</h1>
            <p class="auth-card__lead">Enter your email and we’ll send you a link. No password needed.</p>
          }
        </div>
        <form class="auth-card__form" novalidate (ngSubmit)="submit()" [formGroup]="form">
          @if (showSummary()) {
            <ig-error-summary
              [errors]="[{ controlId: 'email', message: emailMessage }]"
              heading="Fix 1 thing to continue"
            />
          }
          @if (notice(); as n) {
            <ig-alert [kind]="n.kind" [title]="n.title" announce="alert">{{ n.body }}</ig-alert>
          }
          <ig-form-field label="Email" controlId="email" [error]="emailError()">
            <input
              ig-input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              cdkFocusInitial
              [attr.aria-invalid]="emailError() ? 'true' : null"
              [attr.aria-describedby]="describedBy('email', false, !!emailError())"
            />
          </ig-form-field>
          <button ig-button appearance="primary" type="submit" block [busy]="busy()">
            {{ busy() ? 'Sending…' : 'Email me a link' }}
          </button>
        </form>
      }
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
    .auth-card__form {
      display: grid;
      gap: var(--spacingVerticalL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  private readonly auth = inject(AUTH_API);
  private readonly summary = viewChild(ErrorSummary);
  protected readonly describedBy = describedBy;
  protected readonly emailMessage = EMAIL_MESSAGE;

  /** What the API appended after refusing a link: `used`, `expired` or `invalid`. */
  readonly link = input<string>();
  /** Where the link returns to, such as an app's authorization request (L2-093). */
  readonly returnUrl = input<string>();

  /** The name of the app the person is signing in to, looked up by client ID so a crafted link can't set it. */
  protected readonly appName = toSignal(
    toObservable(computed(() => clientIdOf(this.returnUrl()))).pipe(
      switchMap((clientId) =>
        clientId ? this.auth.appName(clientId).pipe(catchError(() => of(null))) : of(null),
      ),
    ),
    { initialValue: null },
  );

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)],
    }),
  });
  protected readonly busy = signal(false);
  protected readonly sentTo = signal<string | null>(null);
  protected readonly submitted = signal(false);
  private readonly failure = signal<Notice | null>(null);

  protected readonly notice = computed(() => this.failure() ?? LINK_NOTICES[this.link() ?? ''] ?? null);
  protected readonly showSummary = computed(() => this.submitted() && this.form.controls.email.invalid);
  protected readonly emailError = computed(() => (this.showSummary() ? EMAIL_MESSAGE : null));

  protected submit(): void {
    if (this.busy()) return;
    this.submitted.set(true);
    this.failure.set(null);
    if (this.form.controls.email.invalid) {
      queueMicrotask(() => this.summary()?.focus());
      return;
    }
    const email = this.form.controls.email.value.trim();
    this.busy.set(true);
    this.auth.requestSignInLink(email, this.returnUrl()).subscribe({
      next: () => {
        this.busy.set(false);
        this.sentTo.set(email);
      },
      error: (error: unknown) => {
        this.busy.set(false);
        const kind = error instanceof ApiError ? error.kind : null;
        if (kind === 'Validation') {
          this.form.controls.email.setErrors({ server: true });
          return;
        }
        this.failure.set(kind === 'RateLimited' ? RATE_LIMITED : FAILED);
      },
    });
  }

  protected reset(): void {
    this.sentTo.set(null);
    this.submitted.set(false);
    this.form.reset({ email: '' });
  }
}
