import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SiteFooter } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-site-footer-scenario',
  imports: [SiteFooter],
  template: `@for (i of items(); track i) {
    <ig-site-footer note="Apps open in a new tab." />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SiteFooterScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SiteFooter', component: SiteFooterScenario };
