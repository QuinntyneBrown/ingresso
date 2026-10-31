import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, LayoutBar } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-layout-bar-scenario',
  imports: [Button, LayoutBar],
  template: `@for (i of items(); track i) {
    <ig-layout-bar
      ><button ig-button appearance="ghost" size="sm" type="button">Reset layout</button
      ><button ig-button appearance="primary" size="sm" type="button">Done</button></ig-layout-bar
    >
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LayoutBarScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'LayoutBar', component: LayoutBarScenario };
