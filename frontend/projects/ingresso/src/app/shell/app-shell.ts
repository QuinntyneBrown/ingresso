import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  Avatar,
  Button,
  Icon,
  Logo,
  Menu,
  MenuItem,
  MenuTrigger,
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
    Menu,
    MenuItem,
    MenuTrigger,
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
          <button
            #accountButton
            ig-button
            type="button"
            appearance="ghost"
            iconOnly
            class="account"
            aria-label="Account menu"
            [igMenuTriggerFor]="account"
          >
            <ig-avatar [initials]="user.initials" />
          </button>
          <ng-template #account>
            <ig-menu>
              <button ig-menu-item type="button" (triggered)="openSettings()">Settings</button>
              <button ig-menu-item type="button" (triggered)="signOut()">Sign out</button>
            </ig-menu>
          </ng-template>
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
    /* The trigger is the avatar itself, so the header keeps its height. */
    .account.account {
      padding: 0;
      border: 0;
      min-width: 0;
      min-height: 0;
      width: auto;
      height: auto;
      border-radius: var(--borderRadiusCircular);
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
  private readonly router = inject(Router);
  protected readonly store = inject(TilesStore);
  protected readonly dialogs = inject(AppDialogs);
  protected readonly session = inject(SessionStore);
  protected readonly wide = injectWideViewport();
  private readonly accountButton = viewChild('accountButton', { read: ElementRef<HTMLElement> });

  /** Edit layout is offered only on a window wide enough for the grid (L2-054). */
  protected toggleEditing(): void {
    if (!this.wide()) return;
    this.store.editing.set(!this.store.editing());
  }

  constructor() {
    this.session.load();
    this.store.load();
  }

  protected openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  /** Asks before ending the session; focus returns to the account button afterwards. */
  protected signOut(): void {
    this.dialogs.openSignOut(this.accountButton()?.nativeElement);
  }

  /** Enter in the search opens the highlighted match in a new tab. */
  protected jump(): void {
    const match = this.store.highlightedTile();
    if (!match) return;
    this.store.markOpened(match.id);
    window.open(match.url, '_blank', 'noopener,noreferrer');
  }
}
