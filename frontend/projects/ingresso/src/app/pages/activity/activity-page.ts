import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ACTIVITY_API, ActivityCategory, ActivityEvent } from 'api';
import { Alert, Button, Chip, Cluster, EmptyState, Link, List, ListItem, Skeleton } from 'components';
import { SessionStore } from '../../state/session-store';
import { activityMeta, activityTitle } from '../../shared/relative-time';

type Load = 'loading' | 'ready' | 'failed';
type Filter = ActivityCategory | 'all';

const FILTERS: { value: Filter; label: string; admin?: boolean }[] = [
  { value: 'all', label: 'All' },
  { value: 'sign-ins', label: 'Sign-ins' },
  { value: 'app-access', label: 'App access' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'apps-and-keys', label: 'Apps and keys', admin: true },
];

/**
 * Settings → Activity: the person's security events, newest first, filtered by type, with Show more; for
 * administrators also app and key changes (L2-142 to L2-145).
 */
@Component({
  selector: 'ig-activity-page',
  imports: [Alert, Button, Chip, Cluster, EmptyState, Link, List, ListItem, RouterLink, Skeleton],
  template: `
    <div class="page">
      <a ig-link variant="back" routerLink="/settings">Back to settings</a>
      <section class="intro">
        <h1>Activity</h1>
        <p class="text-muted">
          Sign-ins and other security events on your account, newest first. ingresso keeps them for 90 days.
        </p>
      </section>
      <div class="stack">
        <ig-cluster role="group" aria-label="Show">
          @for (filter of filters(); track filter.value) {
            <ig-chip
              choice
              [label]="filter.label"
              [pressed]="chosen() === filter.value"
              (pressedChange)="choose(filter.value)"
            />
          }
        </ig-cluster>
        @switch (load()) {
          @case ('loading') {
            <div class="loading" aria-busy="true" aria-label="Loading your activity">
              <ig-skeleton /><ig-skeleton /><ig-skeleton />
            </div>
          }
          @case ('failed') {
            <ig-alert kind="danger" title="We couldn’t load your activity" announce="alert" [actions]="retry">
              Try again in a moment.
            </ig-alert>
          }
          @default {
            @if (events().length) {
              <ul ig-list surface aria-label="Activity">
                @for (event of events(); track event.id) {
                  <li ig-list-item [title]="title(event)" [meta]="meta(event)"></li>
                }
              </ul>
              @if (next() !== null) {
                <div class="more">
                  <button ig-button type="button" [disabled]="loadingMore()" (click)="more()">
                    Show more
                  </button>
                </div>
              }
            } @else {
              <ig-empty-state icon="clock" title="No activity yet">
                <p slot="text">When you sign in, approve an app or end a session, it shows here.</p>
              </ig-empty-state>
            }
          }
        }
      </div>
    </div>
  `,
  styles: `
    .loading {
      display: grid;
      gap: var(--spacingVerticalS);
    }
    .more {
      display: flex;
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage implements OnInit {
  private readonly api = inject(ACTIVITY_API);
  private readonly session = inject(SessionStore);
  private readonly administrator = computed(() => this.session.user()?.role === 'admin');
  protected readonly filters = computed(() => FILTERS.filter((f) => !f.admin || this.administrator()));
  protected readonly chosen = signal<Filter>('all');
  protected readonly load = signal<Load>('loading');
  protected readonly events = signal<ActivityEvent[]>([]);
  protected readonly next = signal<number | null>(null);
  protected readonly loadingMore = signal(false);
  protected readonly retry = [{ label: 'Try again', run: () => this.reload() }];

  ngOnInit(): void {
    this.reload();
  }

  protected choose(filter: Filter): void {
    if (filter === this.chosen()) return;
    this.chosen.set(filter);
    this.reload();
  }

  protected reload(): void {
    this.load.set('loading');
    this.api.list(this.category(), null).subscribe({
      next: (page) => {
        this.events.set(page.events);
        this.next.set(page.next);
        this.load.set('ready');
      },
      error: () => this.load.set('failed'),
    });
  }

  protected more(): void {
    this.loadingMore.set(true);
    this.api.list(this.category(), this.next()).subscribe({
      next: (page) => {
        this.events.update((events) => [...events, ...page.events]);
        this.next.set(page.next);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
        this.load.set('failed');
      },
    });
  }

  protected title(event: ActivityEvent): string {
    return activityTitle(event);
  }

  protected meta(event: ActivityEvent): string {
    return activityMeta(event);
  }

  private category(): ActivityCategory | null {
    const chosen = this.chosen();
    return chosen === 'all' ? null : chosen;
  }
}
