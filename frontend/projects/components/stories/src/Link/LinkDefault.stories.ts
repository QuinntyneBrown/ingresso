import type { StoryObj } from '@storybook/angular';
import { Link } from '../../../src/lib/link/link';

export const Default: StoryObj<Link> = {
  render: () => ({
    template: `<p>Read the <a ig-link href="#">brand guide</a> for the rules.</p>`,
  }),
};
