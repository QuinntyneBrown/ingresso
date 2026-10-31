import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-button-scenario',
  imports: [Button],
  template: `@for (i of items(); track i) {
    <button ig-button type="button" appearance="primary">Add app</button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Button', component: ButtonScenario };
