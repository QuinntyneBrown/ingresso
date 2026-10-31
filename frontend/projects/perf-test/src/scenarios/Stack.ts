import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Stack } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-stack-scenario',
  imports: [Stack],
  template: `@for (i of items(); track i) {
    <ig-stack><span>one</span><span>two</span></ig-stack>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StackScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Stack', component: StackScenario };
