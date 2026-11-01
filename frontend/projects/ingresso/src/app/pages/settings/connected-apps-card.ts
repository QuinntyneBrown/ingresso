import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { ConnectedApp, CONNECTED_APPS_API } from 'api';
import { Alert, Button, Card, EmptyState, List, ListItem, Skeleton } from 'components';
import { connectedLabel } from '../../shared/relative-time';
import { scopePhrase } from '../../shared/scope-phrase';

type Load = 'loading' | 'ready' | 'failed';

/** What Revoke hands the page: the app and the button focus returns to. */
export interface ConnectedAppAction {
  app: ConnectedApp;
  trigger: HTMLElement;
}

/** Settings → Connected apps: the apps the person approved, with Revoke (L2-128, L2-129). */
@Component({
  selector: 'ig-connected-apps-card',
  imports: [Alert, Button, Card, EmptyState, List, ListItem, Skeleton],
  template: `
    <section ig-card title="Connected apps">
      <p class="lead">Apps you’ve let use your ingresso account. Revoke one and it has to ask again.</p>
      @switch (load()) {
        @case ('loading') {
          <div class="loading" aria-busy="true" aria-label="Loading your connected apps">
            <ig-skeleton /><ig-skeleton />
          </div>
        }
        @case ('failed') {
          <ig-alert
            kind="danger"
            title="We couldn’t load your connected apps"
            announce="alert"
            [actions]="retry"
          >
            Try again in a moment.
          </ig-alert>
        }
        @default {
          @if (apps().length) {
            <ul ig-list surface aria-label="Connected apps">
              @for (app of apps(); track app.clientId) {
                <li ig-list-item [title]="app.name" [meta]="can(app)" [detail]="when(app)">
                  <button
                    slot="action"
                    ig-button
                    size="sm"
                    type="button"
                    [attr.aria-label]="'Revoke ' + app.name + '’s access'"
                    (click)="revoke.emit({ app, trigger: $any($event.currentTarget) })"
                  >
                    Revoke
                  </button>
                </li>
              }
            </ul>
          } @else {
            <ig-empty-state icon="link" title="No connected apps" compact>
              <span slot="text">When you let an app use your ingresso account, it shows here.</span>
            </ig-empty-state>
          }
        }
      }
    </section>
  `,
  styles: `
    .lead {
      color: var(--colorNeutralForeground2);
      margin-bottom: var(--spacingVerticalL);
    }
    .loading {
      display: grid;
      gap: var(--spacingVerticalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectedAppsCard implements OnInit {
  private readonly api = inject(CONNECTED_APPS_API);
  protected readonly load = signal<Load>('loading');
  protected readonly apps = signal<ConnectedApp[]>([]);
  protected readonly retry = [{ label: 'Try again', run: () => this.reload() }];

  /** Revoke was chosen; the page asks first. */
  readonly revoke = output<ConnectedAppAction>();

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.load.set('loading');
    this.api.list().subscribe({
      next: (apps) => {
        this.apps.set(apps);
        this.load.set('ready');
      },
      error: () => this.load.set('failed'),
    });
  }

  protected can(app: ConnectedApp): string {
    return `Can ${scopePhrase(app.scopes.map((s) => s.title))}`;
  }

  protected when(app: ConnectedApp): string {
    return connectedLabel(app.approvedAt, app.lastUsedAt);
  }
}
