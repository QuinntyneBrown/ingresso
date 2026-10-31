import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Pagination } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-pagination-scenario',
  imports: [Pagination],
  template: `@for (i of items(); track i) {
    <ig-pagination [page]="6" [pageCount]="12" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PaginationScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Pagination', component: PaginationScenario };
