import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Link } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-link-scenario',
  imports: [Link],
  template: `@for (i of items(); track i) {
    <a ig-link external href="https://billing.northwind.example">Open Northwind Billing</a>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Link', component: LinkScenario };
