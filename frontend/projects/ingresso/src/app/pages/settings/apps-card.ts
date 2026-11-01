import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { CLIENTS_API, RegisteredApp } from 'api';
import { Alert, Button, Card, EmptyState, Icon, List, ListItem, Skeleton } from 'components';

type Load = 'loading' | 'ready' | 'failed';

/** Settings → Apps: the apps that sign in with ingresso, for administrators (L2-104). */
@Component({
  selector: 'ig-apps-card',
  imports: [Alert, Button, Card, EmptyState, Icon, List, ListItem, Skeleton],
  template: `
    <section ig-card title="Apps">
      @if (load() !== 'ready' || apps().length) {
        <button slot="actions" ig-button appearance="primary" type="button" (click)="register.emit($event)">
          <ig-icon name="plus" />Register an app
        </button>
      }
      <p class="lead">Apps that sign people in with ingresso. Only administrators see this.</p>
      @switch (load()) {
        @case ('loading') {
          <div class="loading" aria-busy="true" aria-label="Loading apps">
            <ig-skeleton /><ig-skeleton /><ig-skeleton />
          </div>
        }
        @case ('failed') {
          <ig-alert kind="danger" title="We couldn’t load your apps" announce="alert" [actions]="retry">
            Try again in a moment.
          </ig-alert>
        }
        @default {
          @if (apps().length) {
            <ul ig-list surface aria-label="Registered apps">
              @for (app of apps(); track app.clientId) {
                <li ig-list-item [title]="app.name" [meta]="meta(app)"></li>
              }
            </ul>
          } @else {
            <ig-empty-state icon="lock" title="No apps yet" compact>
              <span slot="text">Register an app so people can sign in to it with ingresso.</span>
              <button
                slot="actions"
                ig-button
                appearance="primary"
                type="button"
                (click)="register.emit($event)"
              >
                Register an app
              </button>
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
export class AppsCard implements OnInit {
  private readonly clients = inject(CLIENTS_API);

  /** Register an app was chosen; the page opens the dialog and calls `reload` after. */
  readonly register = output<Event>();

  protected readonly load = signal<Load>('loading');
  protected readonly apps = signal<RegisteredApp[]>([]);
  protected readonly retry = [{ label: 'Try again', run: () => this.reload() }];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.load.set('loading');
    this.clients.list().subscribe({
      next: (apps) => {
        this.apps.set(apps);
        this.load.set('ready');
      },
      error: () => this.load.set('failed'),
    });
  }

  protected meta(app: RegisteredApp): string {
    return `${app.confidential ? 'Confidential' : 'Public'} · client ID ${app.clientId}`;
  }
}
