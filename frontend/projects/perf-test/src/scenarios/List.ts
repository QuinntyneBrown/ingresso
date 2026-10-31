import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { List, ListItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-list-scenario',
  imports: [List, ListItem],
  template: `@for (i of items(); track i) {
    <ul ig-list surface>
      <li ig-list-item title="Gmail" meta="mail.google.com"></li>
      <li ig-list-item title="Slack" meta="northwind.slack.com"></li>
    </ul>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ListScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'List', component: ListScenario };
