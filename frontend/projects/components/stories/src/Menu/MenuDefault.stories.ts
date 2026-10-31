import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Menu, MenuDivider, MenuItem, MenuTrigger } from '../../../src/lib/menu/menu';

export const Default: StoryObj<Menu> = {
  render: () => ({
    moduleMetadata: { imports: [Button, MenuTrigger, MenuItem, MenuDivider] },
    template: `<button ig-button [igMenuTriggerFor]="account" aria-label="Account menu for Maya Reyes">Maya Reyes</button>
      <ng-template #account>
        <ig-menu>
          <a ig-menu-item href="#settings" shortcut="G S">Settings</a>
          <a ig-menu-item href="#brand">Brand guide</a>
          <ig-menu-divider />
          <button ig-menu-item kind="danger">Sign out</button>
        </ig-menu>
      </ng-template>`,
  }),
};
