import type { Meta } from '@storybook/angular';
import { Stack } from '../../../src/lib/layout/stack';
import bestPractices from './StackBestPractices.md?raw';
import description from './StackDescription.md?raw';

const meta: Meta<Stack> = {
  title: 'Components/Stack',
  component: Stack,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './StackDefault.stories';
export { Gaps } from './StackGaps.stories';
