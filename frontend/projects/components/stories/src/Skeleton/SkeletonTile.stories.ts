import type { StoryObj } from '@storybook/angular';
import { Skeleton } from '../../../src/lib/skeleton/skeleton';

export const Tile: StoryObj<Skeleton> = {
  render: () => ({
    template: `<div style="display: grid; grid-template-columns: 4.5rem 1fr; gap: 1rem; max-width: 40rem"><ig-skeleton width="3.5rem" /><div><ig-skeleton variant="title" width="70%" /><ig-skeleton width="40%" /><ig-skeleton width="55%" /></div></div>`,
  }),
};
