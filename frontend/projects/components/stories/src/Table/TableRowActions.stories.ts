import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Table, TableWrap } from '../../../src/lib/table/table';

export const RowActions: StoryObj<Table> = {
  render: () => ({
    moduleMetadata: { imports: [TableWrap, Button] },
    template: `<ig-table-wrap>
        <table ig-table>
          <caption>Users</caption>
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Maya Reyes</td><td class="mono">maya@example.com</td>
              <td class="num"><span class="row-actions"><button ig-button size="sm" appearance="ghost">Edit<span class="visually-hidden"> Maya Reyes</span></button></span></td>
            </tr>
            <tr>
              <td>Sam Okafor</td><td class="mono">sam@example.com</td>
              <td class="num"><span class="row-actions"><button ig-button size="sm" appearance="ghost">Edit<span class="visually-hidden"> Sam Okafor</span></button></span></td>
            </tr>
          </tbody>
        </table>
      </ig-table-wrap>`,
  }),
};
