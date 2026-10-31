import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InlineMessage } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-inline-message-scenario',
  imports: [InlineMessage],
  template: `@for (i of items(); track i) {
    <ig-inline-message kind="error">Enter a full address, like app.asana.com</ig-inline-message>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InlineMessageScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'InlineMessage', component: InlineMessageScenario };
