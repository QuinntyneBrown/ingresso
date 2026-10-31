import type { StoryObj } from '@storybook/angular';
import { Link } from '../../../src/lib/link/link';

export const Back: StoryObj<Link> = {
  render: () => ({
    template: `<a ig-link variant="back" href="#">Back to your apps</a>`,
  }),
};
