import type { StoryObj } from '@storybook/angular';
import { Cluster } from '../../../src/lib/layout/cluster';
import { Badge } from '../../../src/lib/badge/badge';

export const Between: StoryObj<Cluster> = {
  render: () => ({
    moduleMetadata: { imports: [Badge] },
    template: `<ig-cluster justify="between"><ig-badge>left</ig-badge><ig-badge>right</ig-badge></ig-cluster>`,
  }),
};
