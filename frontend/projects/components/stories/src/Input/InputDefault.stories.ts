import type { StoryObj } from '@storybook/angular';
import { Input } from '../../../src/lib/form/input';

export const Default: StoryObj<Input> = {
  render: () => ({
    template: `<input ig-input aria-label="App name" value="Northwind Billing" />`,
  }),
};
