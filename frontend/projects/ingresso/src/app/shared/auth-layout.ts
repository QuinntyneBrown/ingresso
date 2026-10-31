import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card, Logo } from 'components';

/** The frame for screens that need no header: a centred card with the logo above the content. Used by sign-in. */
@Component({
  selector: 'ig-auth-layout',
  imports: [Card, Logo],
  template: `
    <main id="main" class="auth-layout" tabindex="-1">
      <ig-card class="auth-card">
        <ig-logo class="auth-card__logo" />
        <div class="auth-card__content"><ng-content /></div>
      </ig-card>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .auth-layout {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--spacingVerticalXXL) var(--ig-layout-margin);
    }
    .auth-layout:focus {
      outline: none;
    }
    .auth-card {
      width: 100%;
      max-width: 26rem;
    }
    .auth-card__logo {
      display: flex;
      margin-bottom: var(--spacingVerticalL);
    }
    .auth-card__content {
      display: grid;
      gap: var(--spacingVerticalL);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {}
