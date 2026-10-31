import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, StatusPage } from 'components';

/** Not found (404): unknown routes. */
@Component({
  selector: 'ig-not-found-page',
  imports: [RouterLink, Button, StatusPage],
  template: `
    <ig-status-page code="404" heading="We can't find that page">
      <p slot="message">The page may have moved, or the link has a typo.</p>
      <ng-container slot="actions">
        <a ig-button appearance="primary" routerLink="/">Back to your apps</a>
      </ng-container>
    </ig-status-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
