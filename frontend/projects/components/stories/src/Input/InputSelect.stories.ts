import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Select: StoryObj<Input> = {
  render: () => ({
    template: `<select ig-input aria-label="Category"><option>Work</option><option>Personal</option></select>`,
  }),
};
