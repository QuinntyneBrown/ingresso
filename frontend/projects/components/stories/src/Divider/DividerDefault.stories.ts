import type { StoryObj } from '@storybook/angular';
import { Divider } from '../../../src/lib/divider/divider';

export const Default: StoryObj<Divider> = {
  render: () => ({
    template: `<p>Apps</p><ig-divider /><p>Directory</p>`,
  }),
};
