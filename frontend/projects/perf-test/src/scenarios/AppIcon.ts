import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppIcon } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-app-icon-scenario',
  imports: [AppIcon],
  template: `@for (i of items(); track i) {
    <ig-app-icon initial="NB" color="#2563eb" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppIconScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'AppIcon', component: AppIconScenario };
