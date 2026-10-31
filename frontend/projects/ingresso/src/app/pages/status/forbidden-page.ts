import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, StatusPage } from 'components';

/** Forbidden (403): the account cannot open the page. */
@Component({
  selector: 'ig-forbidden-page',
  imports: [RouterLink, Button, StatusPage],
  template: `
    <ig-status-page code="403" heading="You don’t have a key for this one">
      <p slot="message">
        Your account can’t open this page. Ask the owner of your workspace to grant access.
      </p>
      <ng-container slot="actions">
        <a ig-button appearance="primary" routerLink="/">Back to your apps</a>
      </ng-container>
    </ig-status-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPage {}
