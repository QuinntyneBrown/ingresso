import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { CLIENTS_API, RegisteredApp } from 'api';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Icon,
  List,
  ListItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Skeleton,
} from 'components';

type Load = 'loading' | 'ready' | 'failed';

/** An app's action that opens a dialog, with the control focus returns to when it closes. */
export interface AppAction {
  app: RegisteredApp;
  trigger: HTMLElement;
}

/** Settings → Apps: the apps that sign in with ingresso, for administrators (L2-104), with each app's actions (L2-112 to L2-115). */
@Component({
  selector: 'ig-apps-card',
  imports: [Alert, Button, Card, EmptyState, Icon, List, ListItem, Menu, MenuItem, MenuTrigger, Skeleton],
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
                <li ig-list-item [title]="app.name" [meta]="meta(app)">
                  <span #actions slot="action" class="actions">
                    <button
                      ig-button
                      type="button"
                      appearance="ghost"
                      size="sm"
                      iconOnly
                      [attr.aria-label]="'Actions for ' + app.name"
                      [igMenuTriggerFor]="menu"
                    >
                      <ig-icon name="more" />
                    </button>
                    <ng-template #menu>
                      <ig-menu [attr.aria-label]="app.name">
                        <button
                          ig-menu-item
                          type="button"
                          (triggered)="edit.emit({ app, trigger: menuButton(actions) })"
                        >
                          <ig-icon name="edit" size="sm" />Edit
                        </button>
                      </ig-menu>
                    </ng-template>
                  </span>
                </li>
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
    .actions {
      display: inline-flex;
      align-items: center;
      gap: var(--spacingHorizontalS);
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
  /** Edit was chosen in an app's actions; the page opens the edit dialog. */
  readonly edit = output<AppAction>();

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

  /** The actions button in a row, where focus returns after a dialog it opened. */
  protected menuButton(actions: HTMLElement): HTMLElement {
    return actions.querySelector('button') ?? actions;
  }

  protected meta(app: RegisteredApp): string {
    return `${app.confidential ? 'Confidential' : 'Public'} · client ID ${app.clientId}`;
  }
}
