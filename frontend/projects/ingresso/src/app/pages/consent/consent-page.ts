import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Consent, CONSENT_API } from 'api';
import { Alert, Button, List, ListItem, Skeleton, SkipLink } from 'components';
import { AuthLayout } from '../../shared/auth-layout';
import { scopePhrase } from '../../shared/scope-phrase';

/**
 * Approve an app: what an app asks to see, in plain words, with Allow and Deny (L2-121 to L2-125). Allow records the
 * approval, then both choices resume the app's authorize request, which this page received unchanged (ADR 0018).
 */
@Component({
  selector: 'ig-consent-page',
  imports: [Alert, AuthLayout, Button, List, ListItem, Skeleton, SkipLink],
  template: `
    <ig-skip-link target="main" />
    <ig-auth-layout>
      @if (consent(); as current) {
        <div>
          <h1 class="auth-card__title">
            @if (current.approved.length) {
              {{ current.appName }} wants to do more
            } @else {
              {{ current.appName }} wants to use your ingresso account
            }
          </h1>
          <p class="auth-card__lead">
            Signed in as {{ current.email }}. ingresso remembers your choice for {{ current.appName }}.
          </p>
        </div>
        @if (failed()) {
          <ig-alert kind="danger" title="We couldn’t save your choice" announce="alert">
            Something went wrong on our side. Try again in a moment.
          </ig-alert>
        }
        <section class="consent__scopes" aria-labelledby="consent-can">
          <h2 id="consent-can" class="consent__label">
            {{ current.approved.length ? 'It also wants to:' : 'It will be able to:' }}
          </h2>
          <ul ig-list surface [attr.aria-label]="'What ' + current.appName + ' asks for'">
            @for (item of current.ask; track item.scope) {
              <li ig-list-item [title]="item.title" [meta]="item.scope"></li>
            }
          </ul>
          @if (approvedBefore(); as before) {
            <p class="consent__note">You already let it {{ before }}.</p>
          }
        </section>
      } @else {
        <div>
          <h1 class="auth-card__title">Checking what the app asks for</h1>
          <p class="auth-card__lead">This takes a moment.</p>
        </div>
        <div class="consent__scopes" aria-busy="true" aria-label="Loading what the app asks for">
          <ig-skeleton /><ig-skeleton /><ig-skeleton />
        </div>
      }
      <div class="consent__actions">
        <button
          ig-button
          appearance="primary"
          type="button"
          [busy]="busy()"
          [disabled]="!consent() || busy()"
          (click)="allow()"
        >
          {{ busy() ? 'Allowing…' : 'Allow' }}
        </button>
        <button ig-button type="button" [disabled]="!consent() || busy()" (click)="deny()">Deny</button>
      </div>
      <p class="consent__note consent__note--small">
        Deny sends you back to {{ consent()?.appName ?? 'the app' }} without signing in.
      </p>
    </ig-auth-layout>
  `,
  styles: `
    .auth-card__title {
      font: var(--ig-text-h2);
      letter-spacing: var(--ig-letter-spacing-tight);
    }
    .auth-card__lead,
    .consent__note {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
    .consent__note--small {
      font: var(--ig-text-body-sm);
    }
    .consent__scopes {
      display: grid;
      gap: var(--spacingVerticalM);
    }
    .consent__label {
      font: var(--ig-text-label);
    }
    .consent__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacingHorizontalM);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentPage {
  private readonly api = inject(CONSENT_API);
  private readonly router = inject(Router);
  private readonly location = inject(DOCUMENT).location;
  /** The app's authorize request, exactly as the authorize endpoint sent it here. */
  private readonly query = new URLSearchParams(this.location.search);
  private readonly clientId = this.query.get('client_id') ?? '';
  private readonly scope = this.query.get('scope') ?? '';

  protected readonly consent = toSignal(
    this.api.get(this.clientId, this.scope).pipe(
      catchError(() => {
        void this.router.navigateByUrl('/error');
        return of(null);
      }),
    ),
    { initialValue: null as Consent | null },
  );
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  /** "see your display name and email address": what was approved before, as one phrase (L2-125). */
  protected readonly approvedBefore = computed(() => {
    const approved = this.consent()?.approved ?? [];
    return approved.length ? scopePhrase(approved.map((s) => s.title)) : null;
  });

  protected allow(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.allow(this.clientId, this.scope).subscribe({
      next: () => this.resume(),
      error: () => {
        this.busy.set(false);
        this.failed.set(true);
      },
    });
  }

  protected deny(): void {
    this.query.set('consent', 'deny');
    this.resume();
  }

  /** Back to the authorize endpoint with the same request, which now returns to the app (ADR 0018). */
  private resume(): void {
    this.location.assign(`/connect/authorize?${this.query}`);
  }
}
