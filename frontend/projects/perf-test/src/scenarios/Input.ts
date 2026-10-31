import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Input } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-input-scenario',
  imports: [Input],
  template: `@for (i of items(); track i) {
    <input ig-input aria-label="Name" value="App" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InputScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Input', component: InputScenario };
