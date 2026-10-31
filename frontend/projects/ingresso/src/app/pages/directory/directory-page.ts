import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon, Badge, Button, EmptyState, Icon, List, ListItem, Search } from 'components';
import { CATALOG, CatalogApp } from '../../shared/catalog';
import { AppDialogs } from '../../state/app-dialogs';
import { TilesStore } from '../../state/tiles-store';

/** Compares addresses ignoring the scheme, a leading www. and a trailing slash. */
const addressKey = (url: string): string =>
  url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');

/** The directory: common apps to add in one click, or any address of your own. */
@Component({
  selector: 'ig-directory-page',
  imports: [AppIcon, Badge, Button, EmptyState, Icon, List, ListItem, RouterLink, Search],
  template: `
    <div class="page">
      <a class="back" routerLink="/"><ig-icon name="arrow-left" size="sm" />Back to your apps</a>
      <section class="intro">
        <h1>Add an app</h1>
        <p class="text-muted">Pick a common app to add, or enter any address.</p>
      </section>

      <section aria-labelledby="add-from">
        <h2 id="add-from">Add from</h2>
        <ig-search
          label="Search the directory"
          placeholder="Search the directory"
          shortcut=""
          [(value)]="query"
        />
        @for (group of groups(); track group.category) {
          <section class="dir-section" [attr.aria-labelledby]="'cat-' + group.category">
            <h3 [id]="'cat-' + group.category">{{ group.category }}</h3>
            <ul ig-list variant="catalog">
              @for (app of group.apps; track app.name) {
                <li ig-list-item [title]="app.name" [meta]="app.description">
                  <ig-app-icon slot="media" [initial]="app.initial" [color]="app.color" />
                  @if (isAdded(app)) {
                    <ig-badge slot="action" kind="success">Added</ig-badge>
                  } @else {
                    <button slot="action" ig-button size="sm" type="button" (click)="add(app, $event)">
                      <ig-icon name="plus" size="sm" />Add<span class="visually-hidden"> {{ app.name }}</span>
                    </button>
                  }
                </li>
              }
            </ul>
          </section>
        } @empty {
          <ig-empty-state title="No apps match “{{ query() }}”" icon="search-x" compact>
            <span slot="text">Try a different name, or add it with its address below.</span>
          </ig-empty-state>
        }
      </section>

      <section aria-labelledby="custom">
        <h2 id="custom">Custom URL</h2>
        <p class="text-muted">Add an internal tool or any site that is not listed above.</p>
        <button ig-button appearance="primary" type="button" (click)="custom($event)">
          <ig-icon name="link" />Add a custom URL
        </button>
      </section>
    </div>
  `,
  styleUrl: './directory-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryPage {
  private readonly dialogs = inject(AppDialogs);
  private readonly store = inject(TilesStore);

  protected readonly query = signal('');

  /** The apps matching the search, grouped by category in the order the categories first appear. */
  protected readonly groups = computed(() => {
    const term = this.query().trim().toLowerCase();
    const matches = CATALOG.filter((a) =>
      [a.name, a.description, a.category].some((text) => text.toLowerCase().includes(term)),
    );
    const groups = new Map<string, CatalogApp[]>();
    for (const app of matches) groups.set(app.category, [...(groups.get(app.category) ?? []), app]);
    return [...groups].map(([category, apps]) => ({ category, apps }));
  });

  private readonly onDashboard = computed(() => {
    const tiles = this.store.tiles();
    return {
      names: new Set(tiles.map((t) => t.name.toLowerCase())),
      addresses: new Set(tiles.map((t) => addressKey(t.url))),
    };
  });

  /** An app is Added when a tile has its name or its address. */
  protected isAdded(app: CatalogApp): boolean {
    const have = this.onDashboard();
    return have.names.has(app.name.toLowerCase()) || have.addresses.has(addressKey(app.url));
  }

  protected add(app: CatalogApp, event: Event): void {
    this.dialogs.openAdd(app, event.currentTarget as HTMLElement);
  }

  protected custom(event: Event): void {
    this.dialogs.openAdd(undefined, event.currentTarget as HTMLElement);
  }
}
