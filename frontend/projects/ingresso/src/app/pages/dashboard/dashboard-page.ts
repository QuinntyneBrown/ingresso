import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tile } from 'api';
import {
  Alert,
  AppTile,
  Button,
  EmptyState,
  Icon,
  LayoutBar,
  Skeleton,
  TileGrid,
  TileGridItem,
  TileGridTile,
  ToastService,
} from 'components';
import { greetingFor, openedLabel } from '../../shared/relative-time';
import { AppDialogs } from '../../state/app-dialogs';
import { SessionStore } from '../../state/session-store';
import { TilesStore } from '../../state/tiles-store';
import { injectWideViewport } from '../../shared/wide-viewport';

/** The front door: the greeting and the grid of app tiles, with edit-layout mode for moving and resizing. */
@Component({
  selector: 'ig-dashboard-page',
  imports: [
    Alert,
    AppTile,
    Button,
    EmptyState,
    Icon,
    LayoutBar,
    RouterLink,
    Skeleton,
    TileGrid,
    TileGridTile,
  ],
  template: `
    <div class="page">
      <section class="intro">
        <h1>{{ greeting() }}{{ firstName() ? ', ' + firstName() : '' }}</h1>
        <p class="text-muted">{{ summary() }}</p>
      </section>

      @if (store.editing()) {
        <ig-layout-bar>
          <button ig-button type="button" appearance="ghost" size="sm" (click)="reset($event)">
            <ig-icon name="undo" />Reset layout
          </button>
          <button ig-button type="button" appearance="primary" size="sm" (click)="store.editing.set(false)">
            Done
          </button>
        </ig-layout-bar>
      }

      @switch (store.status()) {
        @case ('loading') {
          <p class="visually-hidden" role="status">Loading apps…</p>
          <div class="grid" aria-hidden="true">
            @for (n of placeholders; track n) {
              <div class="cell cell--large"><ig-skeleton variant="rect" height="9rem" /></div>
            }
          </div>
        }
        @case ('failed') {
          <ig-alert
            kind="danger"
            announce="alert"
            title="We couldn't load your apps"
            [actions]="[{ label: 'Try again', run: reload }]"
          >
            Check your connection and try again.
          </ig-alert>
        }
        @default {
          @if (store.tiles().length === 0) {
            <ig-empty-state icon="grid" title="No apps behind this door yet">
              <span slot="text">Add the apps you build and use, and they show up here as tiles.</span>
              <ng-container slot="actions">
                <button ig-button appearance="primary" type="button" (click)="add($event)">
                  Add your first app
                </button>
                <a ig-button routerLink="/directory">Browse the directory</a>
              </ng-container>
            </ig-empty-state>
          } @else if (store.visible().length === 0) {
            <ig-empty-state icon="search-x" title="No apps match that search" compact>
              <span slot="text">Try another name or address.</span>
              <button slot="actions" ig-button type="button" (click)="store.search.set('')">
                Clear the search
              </button>
            </ig-empty-state>
          } @else {
            <ig-tile-grid
              aria-label="Your apps"
              [layout]="layout()"
              [mode]="store.editing() && !store.search() ? 'edit' : 'live'"
              (layoutChange)="save($event)"
            >
              <ng-template igTileGridTile let-cell>
                @if (byId().get(cell.id); as tile) {
                  <ig-app-tile
                    [name]="tile.name"
                    [url]="tile.url"
                    [initial]="tile.initial"
                    [color]="tile.color"
                    [size]="tile.cols >= 4 && tile.rows >= 3 ? 'large' : 'small'"
                    [description]="tile.description ?? null"
                    [openedLabel]="label(tile)"
                    [editing]="store.editing()"
                    (opened)="store.markOpened(tile.id)"
                    (edit)="dialogs.openEdit(tile)"
                  />
                }
              </ng-template>
            </ig-tile-grid>
          }
        }
      }
    </div>
  `,
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  protected readonly store = inject(TilesStore);
  protected readonly dialogs = inject(AppDialogs);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(ToastService);

  protected readonly placeholders = [1, 2, 3];
  private readonly wide = injectWideViewport();

  /** The visible tiles as grid cells, with ingresso's size limits (L2-051). */
  protected readonly layout = computed<TileGridItem[]>(() =>
    this.store.visible().map((t) => ({
      id: t.id,
      label: t.name,
      x: t.x,
      y: t.y,
      cols: t.cols,
      rows: t.rows,
      minCols: 2,
      maxCols: 12,
      minRows: 1,
      maxRows: 8,
    })),
  );
  protected readonly byId = computed(() => new Map(this.store.tiles().map((t) => [t.id, t])));

  constructor() {
    // Edit mode ends when the window narrows below the grid width (L2-054).
    effect(() => {
      if (!this.wide()) this.store.editing.set(false);
    });
  }
  protected readonly greeting = computed(() => greetingFor(new Date().getHours()));
  protected readonly firstName = computed(() => this.session.user()?.name.split(' ')[0] ?? '');
  protected readonly summary = computed(() => {
    const count = this.store.tiles().length;
    const user = this.session.user();
    const parts = [`${count} ${count === 1 ? 'app' : 'apps'}`];
    if (user?.workspace) {
      parts.push(`signed in to ${user.workspace}${user.signInMethod ? ` with ${user.signInMethod}` : ''}`);
    }
    return parts.join(' · ');
  });

  protected readonly reload = (): void => this.store.load();

  protected label(tile: Tile): string {
    return openedLabel(tile.lastOpenedAt);
  }

  protected add(event: Event): void {
    this.dialogs.openAdd(undefined, event.currentTarget as HTMLElement);
  }

  /** Saves a committed move or resize; only edit mode changes the saved layout. */
  protected save(cells: TileGridItem[]): void {
    if (!this.store.editing() || this.store.search()) return;
    const placements = cells.map(({ id, x, y, cols, rows }) => ({ id, x, y, cols, rows }));
    this.store.saveLayout(placements).subscribe({
      error: () =>
        this.toasts.show({
          kind: 'danger',
          title: "Couldn't save the new layout",
          text: 'Your tiles are back where they were.',
        }),
    });
  }

  protected reset(event: Event): void {
    this.dialogs.openResetLayout(event.currentTarget as HTMLElement);
  }
}
