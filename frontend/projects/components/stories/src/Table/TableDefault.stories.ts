import type { StoryObj } from '@storybook/angular';
import { Table, TableWrap } from '../../../src/lib/table/table';

export const Default: StoryObj<Table> = {
  render: () => ({
    moduleMetadata: { imports: [TableWrap] },
    template: `<ig-table-wrap>
        <table ig-table>
          <caption class="visually-hidden">Apps</caption>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Address</th><th scope="col" class="num">Opens</th></tr>
          </thead>
          <tbody>
            <tr><td>Gmail</td><td class="mono">mail.google.com</td><td class="num">1,204</td></tr>
            <tr aria-selected="true"><td>Linear</td><td class="mono">linear.app</td><td class="num">318</td></tr>
            <tr><td>Northwind Billing</td><td class="mono">billing.northwind.example</td><td class="num">42</td></tr>
          </tbody>
        </table>
      </ig-table-wrap>`,
  }),
};
