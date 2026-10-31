import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Badge } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-badge-scenario',
  imports: [Badge],
  template: `@for (i of items(); track i) {
    <ig-badge kind="warning">Waitlist open</ig-badge>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BadgeScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Badge', component: BadgeScenario };
