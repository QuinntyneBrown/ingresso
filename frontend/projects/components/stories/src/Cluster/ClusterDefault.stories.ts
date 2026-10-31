import type { StoryObj } from '@storybook/angular';
import { Cluster } from '../../../src/lib/layout/cluster';
import { Badge } from '../../../src/lib/badge/badge';

export const Default: StoryObj<Cluster> = {
  args: { justify: 'start' },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [Badge] },
    template: `<ig-cluster [justify]="justify"><ig-badge>Work</ig-badge><ig-badge>Personal</ig-badge><ig-badge>Finance</ig-badge></ig-cluster>`,
  }),
};
