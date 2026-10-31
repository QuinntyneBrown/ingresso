import type { StoryObj } from '@storybook/angular';
import { ProgressBar } from '../../../src/lib/progress-bar/progress-bar';

export const Indeterminate: StoryObj<ProgressBar> = {
  render: () => ({
    template: `<ig-progress-bar label="Working" />`,
  }),
};
