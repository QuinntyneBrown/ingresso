import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Sizes: StoryObj<Button> = {
  render: () => ({
    template: `<div class="cluster"><button ig-button type="button" size="sm">Small</button><button ig-button type="button">Medium</button><button ig-button type="button" size="lg">Large</button></div>`,
  }),
};
