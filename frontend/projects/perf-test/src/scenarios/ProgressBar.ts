import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressBar } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-progress-bar-scenario',
  imports: [ProgressBar],
  template: `@for (i of items(); track i) {
    <ig-progress-bar label="Importing" [value]="60" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ProgressBarScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'ProgressBar', component: ProgressBarScenario };
