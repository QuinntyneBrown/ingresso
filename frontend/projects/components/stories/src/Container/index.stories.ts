import type { Meta } from '@storybook/angular';
import { Container } from '../../../src/lib/layout/container';
import bestPractices from './ContainerBestPractices.md?raw';
import description from './ContainerDescription.md?raw';

const meta: Meta<Container> = {
  title: 'Components/Container',
  component: Container,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ContainerDefault.stories';
export { Narrow } from './ContainerNarrow.stories';
