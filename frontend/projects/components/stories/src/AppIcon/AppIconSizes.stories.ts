import type { StoryObj } from '@storybook/angular';
import { AppIcon } from '../../../src/lib/app-icon/app-icon';

export const Sizes: StoryObj<AppIcon> = {
  render: () => ({
    template: `<div style="display:flex;gap:1rem;align-items:center"><ig-app-icon initial="N" color="#CF3B20" size="sm" /><ig-app-icon initial="N" color="#CF3B20" /><ig-app-icon initial="N" color="#CF3B20" size="lg" /></div>`,
  }),
};
