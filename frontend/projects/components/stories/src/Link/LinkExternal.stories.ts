import type { StoryObj } from '@storybook/angular';
import { Link } from '../../../src/lib/link/link';

export const External: StoryObj<Link> = {
  render: () => ({
    template: `<a ig-link external href="https://linear.app">Open Linear</a>`,
  }),
};
