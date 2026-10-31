import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button, StatusPage } from 'components';

/** Server error (500). */
@Component({
  selector: 'ig-server-error-page',
  imports: [RouterLink, Button, StatusPage],
  template: `
    <ig-status-page code="500" heading="Something went wrong on our side">
      <p slot="message">We’ve been told and are looking into it. Try again in a moment.</p>
      <ng-container slot="actions">
        <button ig-button type="button" appearance="primary" (click)="retry()">Try again</button>
        <a ig-button routerLink="/">Back to your apps</a>
      </ng-container>
    </ig-status-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorPage {
  private readonly router = inject(Router);

  retry(): void {
    void this.router.navigateByUrl('/');
  }
}
