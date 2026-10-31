import type { StoryObj } from '@storybook/angular';
import { Spinner } from '../../../src/lib/spinner/spinner';
import { Cluster } from '../../../src/lib/layout/cluster';

export const Sizes: StoryObj<Spinner> = {
  render: () => ({
    moduleMetadata: { imports: [Cluster] },
    template: `<ig-cluster><ig-spinner label="Loading" /><ig-spinner label="Loading" size="lg" /></ig-cluster>`,
  }),
};
