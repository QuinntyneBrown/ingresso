import type { StoryObj } from '@storybook/angular';
import { ProgressBar } from '../../../src/lib/progress-bar/progress-bar';

export const Success: StoryObj<ProgressBar> = {
  render: () => ({
    template: `<ig-progress-bar label="Done" [value]="100" kind="success" />`,
  }),
};
