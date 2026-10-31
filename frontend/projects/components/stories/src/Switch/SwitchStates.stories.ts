import type { StoryObj } from '@storybook/angular';
import { Switch } from '../../../src/lib/switch/switch';

export const States: StoryObj<Switch> = {
  render: () => ({
    template: `<div class="stack stack--sm">
      <ig-switch>Open apps in a new tab</ig-switch>
      <ig-switch checked>Show recent tiles larger</ig-switch>
      <ig-switch disabled>Sync across devices (off, disabled)</ig-switch>
      <ig-switch checked disabled>Keep me signed in (on, disabled)</ig-switch>
    </div>`,
  }),
};
