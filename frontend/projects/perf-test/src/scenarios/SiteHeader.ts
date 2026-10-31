import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SiteHeader, Logo } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-site-header-scenario',
  imports: [SiteHeader, Logo],
  template: `@for (i of items(); track i) {
    <ig-site-header><ig-logo slot="brand" /></ig-site-header>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SiteHeaderScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SiteHeader', component: SiteHeaderScenario };
