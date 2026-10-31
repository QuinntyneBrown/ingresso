import type { StoryObj } from '@storybook/angular';
import { SortHeader, Table, TableWrap } from '../../../src/lib/table/table';

const apps = [
  { name: 'Gmail', address: 'mail.google.com' },
  { name: 'Linear', address: 'linear.app' },
  { name: 'Northwind Billing', address: 'billing.northwind.example' },
];

export const Sortable: StoryObj<Table> = {
  render: () => ({
    moduleMetadata: { imports: [TableWrap, SortHeader] },
    props: { apps, reversed: [...apps].reverse(), sort: 'ascending' },
    template: `<ig-table-wrap label="Apps, sortable by name">
        <table ig-table>
          <caption class="visually-hidden">Apps</caption>
          <thead>
            <tr><th ig-sort-header scope="col" [(sort)]="sort">App</th><th scope="col">Address</th></tr>
          </thead>
          <tbody>
            @for (app of sort === 'descending' ? reversed : apps; track app.name) {
              <tr><td>{{ app.name }}</td><td class="mono">{{ app.address }}</td></tr>
            }
          </tbody>
        </table>
      </ig-table-wrap>`,
  }),
};
