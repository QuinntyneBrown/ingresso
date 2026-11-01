import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Logo, SiteHeader, StatusPage } from 'components';

/**
 * Can't sign in to this app: an authorization request from an unknown app or an unregistered address (L2-094), or,
 * with `flow=sign-out`, a sign-out request ingresso cannot trust (L2-102). Outside the shell, because the person may
 * be signed out.
 */
@Component({
  selector: 'ig-authorize-error-page',
  imports: [RouterLink, Button, Logo, SiteHeader, StatusPage],
  template: `
    <ig-site-header>
      <a slot="brand" class="brand" routerLink="/" aria-label="ingresso home"><ig-logo /></a>
    </ig-site-header>
    <main id="main" tabindex="-1">
      <ig-status-page code="400" [heading]="heading()">
        <p slot="message">{{ message() }}</p>
        <ng-container slot="actions">
          <a ig-button appearance="primary" routerLink="/">Go to your apps</a>
        </ng-container>
      </ig-status-page>
    </main>
  `,
  styles: `
    .brand {
      display: inline-flex;
      color: inherit;
      text-decoration: none;
      border-radius: var(--borderRadiusMedium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizeErrorPage {
  /** `sign-out` when an app's sign-out request was refused. */
  readonly flow = input<string>();

  private readonly signOut = computed(() => this.flow() === 'sign-out');
  protected readonly heading = computed(() =>
    this.signOut() ? 'This app can’t sign you out with ingresso' : 'This app can’t sign in with ingresso',
  );
  protected readonly message = computed(() =>
    this.signOut()
      ? 'The app asked to sign you out, but ingresso doesn’t recognise the address it gave to return to. You haven’t been signed out or sent anywhere. Let the app’s owner know.'
      : 'The app asked to sign you in, but ingresso doesn’t recognise it or the address it gave. You haven’t been sent anywhere. Let the app’s owner know.',
  );
}
