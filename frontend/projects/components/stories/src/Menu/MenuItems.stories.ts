import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';
import { Menu, MenuDivider, MenuItem } from '../../../src/lib/menu/menu';

export const Items: StoryObj<Menu> = {
  render: () => ({
    moduleMetadata: { imports: [Icon, MenuItem, MenuDivider] },
    template: `<ig-menu aria-label="Tile actions" style="max-width: 16rem">
        <button ig-menu-item shortcut="E"><ig-icon name="edit" />Edit</button>
        <button ig-menu-item><ig-icon name="copy" />Copy address</button>
        <button ig-menu-item disabled><ig-icon name="share" />Share (unavailable)</button>
        <ig-menu-divider />
        <button ig-menu-item kind="danger"><ig-icon name="trash" />Delete</button>
      </ig-menu>`,
  }),
};
