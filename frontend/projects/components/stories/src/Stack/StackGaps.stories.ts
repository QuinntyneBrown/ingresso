import type { StoryObj } from '@storybook/angular';
import { Stack } from '../../../src/lib/layout/stack';
import { Badge } from '../../../src/lib/badge/badge';
import { Cluster } from '../../../src/lib/layout/cluster';

export const Gaps: StoryObj<Stack> = {
  render: () => ({
    moduleMetadata: { imports: [Badge, Cluster] },
    template: `<ig-cluster><ig-stack gap="sm"><ig-badge>sm</ig-badge><ig-badge>sm</ig-badge></ig-stack><ig-stack><ig-badge>md</ig-badge><ig-badge>md</ig-badge></ig-stack><ig-stack gap="lg"><ig-badge>lg</ig-badge><ig-badge>lg</ig-badge></ig-stack></ig-cluster>`,
  }),
};
