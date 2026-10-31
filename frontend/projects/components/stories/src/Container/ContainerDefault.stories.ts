import type { StoryObj } from '@storybook/angular';
import { Container } from '../../../src/lib/layout/container';

export const Default: StoryObj<Container> = {
  render: () => ({
    template: `<ig-container><p>Page content sits inside the container, capped at the layout max width with a responsive side margin.</p></ig-container>`,
  }),
};
