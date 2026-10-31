import type { StoryObj } from '@storybook/angular';
import { Icon } from '../../../src/lib/icon/icon';

export const Sizes: StoryObj<Icon> = {
  render: () => ({
    template: `<div style="display: flex; gap: 1rem; align-items: center">
      <ig-icon name="pin" size="sm" /><ig-icon name="pin" /><ig-icon name="pin" size="lg" />
    </div>`,
  }),
};
