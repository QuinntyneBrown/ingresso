import type { StoryObj } from '@storybook/angular';
import { LayoutBar } from '../../../src/lib/layout-bar/layout-bar';

export const Unavailable: StoryObj<LayoutBar> = {
  render: () => ({
    template: `<ig-layout-bar unavailable />`,
  }),
};
