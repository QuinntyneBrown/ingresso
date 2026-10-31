import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Check, Choice } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-choice-scenario',
  imports: [Check, Choice],
  template: `@for (i of items(); track i) {
    <label ig-choice><input ig-check type="checkbox" />Work</label>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ChoiceScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Choice', component: ChoiceScenario };
