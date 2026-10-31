import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Divider } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-divider-scenario',
  imports: [Divider],
  template: `@for (i of items(); track i) {
    <ig-divider />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DividerScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Divider', component: DividerScenario };
