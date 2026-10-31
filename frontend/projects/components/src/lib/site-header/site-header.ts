import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The top bar: the brand (`[slot=brand]`) on the left, the search (`[slot=search]`) centred and the actions
 * (`[slot=actions]`) on the right. Below 768 px the search drops to a second row.
 */
@Component({
  selector: 'ig-site-header',
  template: `
    <header class="site-header">
      <div class="site-header__inner">
        <div class="site-header__brand"><ng-content select="[slot=brand]" /></div>
        <div class="site-header__search"><ng-content select="[slot=search]" /></div>
        <div class="site-header__actions"><ng-content select="[slot=actions]" /></div>
      </div>
    </header>
  `,
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {}
