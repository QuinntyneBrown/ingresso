import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Sizes: StoryObj<Input> = {
  render: () => ({
    template: `<div class="stack stack--sm"><select ig-input class="input--sm" aria-label="Small"><option>Small</option></select><select ig-input aria-label="Medium"><option>Medium</option></select><input ig-input class="input--lg" aria-label="Large" value="Large" /></div>`,
  }),
};
