import type { StoryObj } from '@storybook/angular';
import { Container } from '../../../src/lib/layout/container';

export const Narrow: StoryObj<Container> = {
  render: () => ({
    template: `<ig-container narrow><p>A narrow container caps reading content, such as a form or an article, at 42rem.</p></ig-container>`,
  }),
};
