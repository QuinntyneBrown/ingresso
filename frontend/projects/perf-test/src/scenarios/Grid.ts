import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Grid } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-grid-scenario',
  imports: [Grid],
  template: `@for (i of items(); track i) {
    <ig-grid auto><span>a</span><span>b</span><span>c</span></ig-grid>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GridScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Grid', component: GridScenario };
