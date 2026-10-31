import type { StoryObj } from '@storybook/angular';
import { Badge } from '../../../src/lib/badge/badge';

export const Kinds: StoryObj<Badge> = {
  render: () => ({
    template: `<div class="cluster"><ig-badge>Draft</ig-badge><ig-badge kind="info">In review</ig-badge><ig-badge kind="success">Published</ig-badge><ig-badge kind="warning">Waitlist open</ig-badge><ig-badge kind="danger">Cancelled</ig-badge><ig-badge kind="brand">Featured</ig-badge><ig-badge kind="count">3</ig-badge></div>`,
  }),
};
