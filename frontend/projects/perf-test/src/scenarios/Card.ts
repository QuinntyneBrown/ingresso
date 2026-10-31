import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Card } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-card-scenario',
  imports: [Card],
  template: `@for (i of items(); track i) {
    <section ig-card title="Profile"><p>Shown in the dashboard greeting.</p></section>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CardScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Card', component: CardScenario };
