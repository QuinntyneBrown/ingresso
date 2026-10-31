import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Alert } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-alert-scenario',
  imports: [Alert],
  template: `@for (i of items(); track i) {
    <ig-alert kind="info" title="Layout saved">Your tiles keep their order on every device.</ig-alert>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AlertScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Alert', component: AlertScenario };
