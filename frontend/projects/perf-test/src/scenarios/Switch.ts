import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Switch } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-switch-scenario',
  imports: [Switch],
  template: `@for (i of items(); track i) {
    <ig-switch [checked]="i % 2 === 0">Open apps in a new tab</ig-switch>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SwitchScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Switch', component: SwitchScenario };
