import type { StoryObj } from '@storybook/angular';
import { Logo } from '../../../src/lib/logo/logo';

export const Default: StoryObj<Logo> = {
  args: { wordmark: true, size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ig-logo [wordmark]="wordmark" [size]="size" />`,
  }),
};
