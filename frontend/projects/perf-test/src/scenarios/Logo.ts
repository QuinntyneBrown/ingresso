import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Logo } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-logo-scenario',
  imports: [Logo],
  template: `@for (i of items(); track i) {
    <ig-logo />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LogoScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Logo', component: LogoScenario };
