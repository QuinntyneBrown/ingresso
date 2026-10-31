import type { StoryObj } from '@storybook/angular';
import { AppIcon } from '../../../src/lib/app-icon/app-icon';

export const Default: StoryObj<AppIcon> = {
  args: { initial: 'NB', color: '#2563eb', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ig-app-icon [initial]="initial" [color]="color" [size]="size" />`,
  }),
};
