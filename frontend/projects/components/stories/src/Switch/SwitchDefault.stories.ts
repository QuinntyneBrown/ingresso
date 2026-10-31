import type { StoryObj } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';

export const Default: StoryObj<Switch> = {
  args: { checked: true, disabled: false },
  render: (args) => ({
    props: args,
    template: `<ig-switch [(checked)]="checked" [disabled]="disabled">Show recent tiles larger</ig-switch>`,
  }),
};
