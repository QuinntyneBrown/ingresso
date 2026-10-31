import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  Avatar,
  Button,
  Icon,
  Logo,
  Search,
  SiteFooter,
  SiteHeader,
  SkipLink,
  ToastRegion,
  Tooltip,
} from 'components';
import { AppDialogs } from '../state/app-dialogs';
import { SessionStore } from '../state/session-store';
import { TilesStore } from '../state/tiles-store';
import { injectWideViewport } from '../shared/wide-viewport';

/** The frame every page sits in: skip link, header, main region and footer. */
@Component({
  selector: 'ig-app-shell',
  imports: [
    Avatar,
    Button,
    Icon,
    Logo,
    RouterLink,
    RouterOutlet,
    Search,
    SiteFooter,
    SiteHeader,
    SkipLink,
    ToastRegion,
    Tooltip,
  ],
  template: `
    <ig-skip-link target="main" />
    <ig-site-header>
      <a slot="brand" class="brand" routerLink="/" aria-label="ingresso home"><ig-logo /></a>
      <ig-search
        slot="search"
        [(value)]="store.search"
        (searched)="jump()"
        (navigated)="store.moveHighlight($event)"
      />
      <ng-container slot="actions">
        <button
          ig-button
          type="button"
          [class.has-tooltip]="!wide()"
          [attr.aria-pressed]="store.editing()"
          [attr.aria-disabled]="!wide() ? 'true' : null"
          [attr.aria-describedby]="!wide() ? 'edit-layout-unavailable' : null"
          [disabled]="store.tiles().length === 0"
          (click)="toggleEditing()"
        >
          {{ store.editing() ? 'Done' : 'Edit layout' }}
          @if (!wide()) {
            <ig-tooltip id="edit-layout-unavailable" placement="below"
              >Widen the window to at least 1024 pixels to edit the layout.</ig-tooltip
            >
          }
        </button>
        <button
          ig-button
          appearance="primary"
          type="button"
          (click)="dialogs.openAdd(undefined, $any($event.currentTarget))"
        >
          <ig-icon name="plus" />Add app
        </button>
        @if (session.user(); as user) {
          <ig-avatar [initials]="user.initials" />
        }
      </ng-container>
    </ig-site-header>
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <ig-toast-region />
    <ig-site-footer note="Apps open in a new tab. ingresso never sees what you do inside them.">
      <a
        slot="links"
        href="https://project-app-access-dashboard-293.magicpatterns.app"
        target="_blank"
        rel="noopener noreferrer"
        >Brand guide</a
      >
    </ig-site-footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }
    main {
      flex: 1;
      width: 100%;
    }
    main:focus {
      outline: none;
    }
    .brand {
      display: inline-flex;
      color: inherit;
      text-decoration: none;
      border-radius: var(--borderRadiusMedium);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly store = inject(TilesStore);
  protected readonly dialogs = inject(AppDialogs);
  protected readonly session = inject(SessionStore);
  protected readonly wide = injectWideViewport();

  /** Edit layout is offered only on a window wide enough for the grid (L2-054). */
  protected toggleEditing(): void {
    if (!this.wide()) return;
    this.store.editing.set(!this.store.editing());
  }

  constructor() {
    this.session.load();
    this.store.load();
  }

  /** Enter in the search opens the highlighted match in a new tab. */
  protected jump(): void {
    const match = this.store.highlightedTile();
    if (!match) return;
    this.store.markOpened(match.id);
    window.open(match.url, '_blank', 'noopener,noreferrer');
  }
}
