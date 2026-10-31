import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, Tooltip } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-tooltip-scenario',
  imports: [Button, Tooltip],
  template: `@for (i of items(); track i) {
    <button ig-button type="button" class="has-tooltip">i<ig-tooltip>Info</ig-tooltip></button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TooltipScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Tooltip', component: TooltipScenario };
