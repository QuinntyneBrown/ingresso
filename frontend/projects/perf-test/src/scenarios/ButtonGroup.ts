import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, ButtonGroup } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-button-group-scenario',
  imports: [Button, ButtonGroup],
  template: `@for (i of items(); track i) {
    <ig-button-group label="View"
      ><button ig-button type="button">List</button
      ><button ig-button type="button" aria-pressed="true">Month</button></ig-button-group
    >
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonGroupScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'ButtonGroup', component: ButtonGroupScenario };
