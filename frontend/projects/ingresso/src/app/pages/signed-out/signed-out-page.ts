import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  Renderer2,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AUTH_API, SignedOutApp } from 'api';
import { Button, List, ListItem, SkipLink, Spinner } from 'components';
import { AuthLayout } from '../../shared/auth-layout';

/** How long to wait for an app's front-channel frame before giving up on it (ADR 0015). */
export const FRAME_TIMEOUT_MS = 5000;

/**
 * You're signed out: loads each app's front-channel sign-out address in a hidden frame, then lists the apps, or
 * continues to the app that started the sign-out (L2-100, L2-101). Outside the shell: the session has ended.
 */
@Component({
  selector: 'ig-signed-out-page',
  imports: [AuthLayout, Button, List, ListItem, RouterLink, SkipLink, Spinner],
  template: `
    <ig-skip-link target="main" />
    <ig-auth-layout>
      @if (done()) {
        <div>
          <h1 class="auth-card__title">You’re signed out</h1>
          <p class="auth-card__lead">
            @if (apps().length) {
              You’re signed out of ingresso and these apps on this device:
            } @else {
              You’re signed out of ingresso on this device.
            }
          </p>
        </div>
        @if (apps().length) {
          <ul ig-list surface aria-label="Apps signed out">
            @for (app of apps(); track app.logoutUri) {
              <li ig-list-item [title]="app.name"></li>
            }
          </ul>
        }
        <a ig-button appearance="primary" block routerLink="/sign-in">Sign in again</a>
      } @else {
        <div>
          <h1 class="auth-card__title">Signing you out</h1>
          <p class="auth-card__lead">
            Signing you out of ingresso and the apps you signed in to with it. This takes a moment.
          </p>
        </div>
        <div class="progress">
          <ig-spinner [label]="progress()" />
          <span aria-hidden="true">{{ progress() }}…</span>
        </div>
      }
    </ig-auth-layout>
  `,
  styles: `
    .auth-card__title {
      font: var(--ig-text-h2);
      letter-spacing: var(--ig-letter-spacing-tight);
    }
    .auth-card__lead {
      margin-top: var(--spacingVerticalXS);
      color: var(--colorNeutralForeground2);
    }
    .progress {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalM);
      color: var(--colorNeutralForeground2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignedOutPage implements OnInit {
  private readonly auth = inject(AUTH_API);
  private readonly renderer = inject(Renderer2);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly location = inject(DOCUMENT).location;

  /** The signed-out ticket the API issued when the session ended. */
  readonly ticket = input<string>();

  protected readonly apps = signal<SignedOutApp[]>([]);
  protected readonly done = signal(false);
  private readonly returnUrl = signal<string | null>(null);
  private loaded = 0;

  protected readonly progress = computed(() => {
    const count = this.apps().length;
    return `Signing out of ${count} ${count === 1 ? 'app' : 'apps'}`;
  });

  ngOnInit(): void {
    const ticket = this.ticket();
    if (!ticket) {
      this.done.set(true);
      return;
    }
    this.auth.signedOut(ticket).subscribe({
      next: (signedOut) => {
        this.returnUrl.set(signedOut.returnUrl);
        this.apps.set(signedOut.apps);
        if (signedOut.apps.length === 0) {
          this.finish();
          return;
        }
        signedOut.apps.forEach((app) => this.notify(app));
        setTimeout(() => this.finish(), FRAME_TIMEOUT_MS);
      },
      error: () => this.done.set(true),
    });
  }

  /**
   * Loads the app's front-channel sign-out address in a hidden frame. The address comes from the API's ticket, never
   * from the link. `src` is set before the frame is attached, so an empty frame's about:blank load never counts.
   * Frames stay until the page is left, so a slow app still gets its request.
   */
  private notify(app: SignedOutApp): void {
    const frame = this.renderer.createElement('iframe') as HTMLIFrameElement;
    frame.hidden = true;
    frame.title = `Signing out of ${app.name}`;
    frame.addEventListener('load', () => this.frameLoaded(), { once: true });
    frame.src = app.logoutUri;
    this.renderer.appendChild(this.host.nativeElement, frame);
  }

  private frameLoaded(): void {
    this.loaded++;
    if (this.loaded >= this.apps().length) this.finish();
  }

  private finish(): void {
    if (this.done()) return;
    this.done.set(true);
    const returnUrl = this.returnUrl();
    if (returnUrl) this.location.assign(returnUrl);
  }
}
