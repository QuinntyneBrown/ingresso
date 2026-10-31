import type { StoryObj } from '@storybook/angular';
import { AppIcon } from '../../../src/lib/app-icon/app-icon';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';
import { List, ListItem } from '../../../src/lib/list/list';

export const Catalog: StoryObj<List> = {
  render: () => ({
    moduleMetadata: { imports: [ListItem, AppIcon, Button, Icon] },
    template: `<ul ig-list variant="catalog">
      <li ig-list-item title="Asana" meta="Projects and tasks."><ig-app-icon slot="media" initial="A" color="#e8384f" /><button ig-button size="sm" type="button" slot="action"><ig-icon name="plus" />Add<span class="visually-hidden"> Asana</span></button></li>
      <li ig-list-item title="Linear" meta="Issues and cycles."><ig-app-icon slot="media" initial="L" color="#5e6ad2" /><button ig-button size="sm" type="button" slot="action"><ig-icon name="plus" />Add<span class="visually-hidden"> Linear</span></button></li>
    </ul>`,
  }),
};
