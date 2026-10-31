import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SortHeader, Table, TableWrap } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-table-scenario',
  imports: [Table, TableWrap, SortHeader],
  template: `@for (i of items(); track i) {
    <ig-table-wrap>
      <table ig-table>
        <caption class="visually-hidden">
          Apps
        </caption>
        <thead>
          <tr>
            <th ig-sort-header scope="col" sort="ascending">App</th>
            <th scope="col">Address</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gmail</td>
            <td class="mono">mail.google.com</td>
          </tr>
          <tr aria-selected="true">
            <td>Linear</td>
            <td class="mono">linear.app</td>
          </tr>
        </tbody>
      </table>
    </ig-table-wrap>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TableScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Table', component: TableScenario };
