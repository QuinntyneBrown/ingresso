import type { StoryObj } from '@storybook/angular';
import { Avatar } from '../../../src/lib/avatar/avatar';

export const Sizes: StoryObj<Avatar> = {
  render: () => ({
    template: `<div class="cluster"><ig-avatar initials="PN" size="sm" /><ig-avatar initials="PN" /><ig-avatar initials="PN" size="lg" /><ig-avatar initials="PN" size="xl" /></div>`,
  }),
};
