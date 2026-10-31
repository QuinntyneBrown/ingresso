import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-icon-scenario',
  imports: [Icon],
  template: `@for (i of items(); track i) {
    <ig-icon name="grid" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class IconScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Icon', component: IconScenario };
