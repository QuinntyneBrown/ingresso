import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<Button> = {
  args: { appearance: 'secondary', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<button ig-button type="button" [appearance]="appearance" [size]="size">Open the app</button>`,
  }),
};
