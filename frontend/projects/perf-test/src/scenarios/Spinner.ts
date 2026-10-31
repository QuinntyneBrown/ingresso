import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Spinner } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-spinner-scenario',
  imports: [Spinner],
  template: `@for (i of items(); track i) {
    <ig-spinner label="Loading apps" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpinnerScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Spinner', component: SpinnerScenario };
