import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyState } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-empty-state-scenario',
  imports: [EmptyState],
  template: `@for (i of items(); track i) {
    <ig-empty-state title="No apps behind this door yet" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyStateScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'EmptyState', component: EmptyStateScenario };
