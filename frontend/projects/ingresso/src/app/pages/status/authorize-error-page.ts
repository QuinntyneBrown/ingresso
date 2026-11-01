import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Logo, SiteHeader, StatusPage } from 'components';

/**
 * Can't sign in to this app: an authorization request from an unknown app or an unregistered address (L2-094).
 * Outside the shell, because the person may be signed out.
 */
@Component({
  selector: 'ig-authorize-error-page',
  imports: [RouterLink, Button, Logo, SiteHeader, StatusPage],
  template: `
    <ig-site-header>
      <a slot="brand" class="brand" routerLink="/" aria-label="ingresso home"><ig-logo /></a>
    </ig-site-header>
    <main id="main" tabindex="-1">
      <ig-status-page code="400" heading="This app can’t sign in with ingresso">
        <p slot="message">
          The app asked to sign you in, but ingresso doesn’t recognise it or the address it gave. You haven’t
          been sent anywhere. Let the app’s owner know.
        </p>
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
export class AuthorizeErrorPage {}
