import type { StoryObj } from '@storybook/angular';
import { ProgressBar } from '../../../src/lib/progress-bar/progress-bar';

export const Default: StoryObj<ProgressBar> = {
  args: { label: 'Importing', value: 60, kind: 'brand' },
  render: (args) => ({
    props: args,
    template: `<ig-progress-bar [label]="label" [value]="value" [kind]="kind" />`,
  }),
};
