import type { StoryObj } from '@storybook/angular';
import { Chip } from '../../../src/lib/chip/chip';
import { Cluster } from '../../../src/lib/layout/cluster';

export const Filters: StoryObj<Chip> = {
  render: () => ({
    moduleMetadata: { imports: [Cluster] },
    template: `<ig-cluster><ig-chip label="Recent" [pressed]="true" /><ig-chip label="Work" /></ig-cluster>`,
  }),
};
