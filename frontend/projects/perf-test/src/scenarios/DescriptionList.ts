import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DescriptionList, DescriptionListItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-description-list-scenario',
  imports: [DescriptionList],
  template: `@for (i of items(); track i) {
    <ig-description-list [items]="facts" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DescriptionListScenario {
  readonly items = input.required<number[]>();
  protected readonly facts: DescriptionListItem[] = [
    { term: 'Address', description: 'linear.app', mono: true },
    { term: 'Last opened', description: '52 minutes ago' },
  ];
}

export const scenario: Scenario = { name: 'DescriptionList', component: DescriptionListScenario };
