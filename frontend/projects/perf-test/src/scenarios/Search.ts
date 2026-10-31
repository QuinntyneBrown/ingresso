import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Search } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-search-scenario',
  imports: [Search],
  template: `@for (i of items(); track i) {
    <ig-search />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SearchScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Search', component: SearchScenario };
