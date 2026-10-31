import type { Meta } from '@storybook/angular';
import { Cluster } from '../../../src/lib/layout/cluster';
import bestPractices from './ClusterBestPractices.md?raw';
import description from './ClusterDescription.md?raw';

const meta: Meta<Cluster> = {
  title: 'Components/Cluster',
  component: Cluster,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ClusterDefault.stories';
export { Between } from './ClusterBetween.stories';
