import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Default: StoryObj<Icon> = {
  args: { name: 'grid' },
  render: (args) => ({ props: args, template: `<ig-icon [name]="name" />` }),
};
