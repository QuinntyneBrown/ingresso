import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon, Button, Icon } from 'components';
import { CATALOG, CatalogApp } from '../../shared/catalog';
import { AppDialogs } from '../../state/app-dialogs';
import { TilesStore } from '../../state/tiles-store';

/** The directory: common apps to add in one click, or any address of your own. */
@Component({
  selector: 'ig-directory-page',
  imports: [AppIcon, Button, Icon, RouterLink],
  template: `
    <div class="page">
      <a class="back" routerLink="/"><ig-icon name="arrow-left" size="sm" />Back to your apps</a>
      <section class="intro">
        <h1>Add an app</h1>
        <p class="text-muted">Pick a common app to add, or enter any address.</p>
      </section>

      <section aria-labelledby="add-from">
        <h2 id="add-from">Add from</h2>
        <ul class="catalog">
          @for (app of apps(); track app.name) {
            <li class="catalog__item">
              <ig-app-icon [initial]="app.initial" [color]="app.color" />
              <span class="catalog__text">
                <span class="catalog__name">{{ app.name }}</span>
                <span class="catalog__description">{{ app.description }}</span>
              </span>
              <button ig-button size="sm" type="button" (click)="add(app, $event)">
                <ig-icon name="plus" size="sm" />Add<span class="visually-hidden"> {{ app.name }}</span>
              </button>
            </li>
          }
        </ul>
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

  /** Apps already on the dashboard are not offered again. */
  protected readonly apps = computed(() => {
    const have = new Set(this.store.tiles().map((t) => t.name.toLowerCase()));
    return CATALOG.filter((a) => !have.has(a.name.toLowerCase()));
  });

  protected add(app: CatalogApp, event: Event): void {
    this.dialogs.openAdd(app, event.currentTarget as HTMLElement);
  }

  protected custom(event: Event): void {
    this.dialogs.openAdd(undefined, event.currentTarget as HTMLElement);
  }
}
