import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button, Icon, StatusPage } from 'components';

/** Offline: ingresso needs a connection the first time. */
@Component({
  selector: 'ig-offline-page',
  imports: [Button, Icon, StatusPage],
  template: `
    <ig-status-page heading="You’re offline">
      <ig-icon slot="icon" name="wifi-off" />
      <p slot="message">
        ingresso needs a connection the first time. Reconnect and we’ll pick up where you left off.
      </p>
      <ng-container slot="actions">
        <button ig-button type="button" appearance="primary" (click)="retry()">Try again</button>
      </ng-container>
    </ig-status-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflinePage {
  private readonly router = inject(Router);

  retry(): void {
    void this.router.navigateByUrl('/');
  }
}
