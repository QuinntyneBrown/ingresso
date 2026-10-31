import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Labelled: StoryObj<Icon> = {
  args: { name: 'link', label: 'Link' },
  render: (args) => ({ props: args, template: `<ig-icon [name]="name" [label]="label" />` }),
};
