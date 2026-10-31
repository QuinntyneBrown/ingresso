import type { StoryObj } from '@storybook/angular';
import { Spinner } from '../../../src/lib/spinner/spinner';

export const Default: StoryObj<Spinner> = {
  args: { label: 'Loading apps', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ig-spinner [label]="label" [size]="size" />`,
  }),
};
