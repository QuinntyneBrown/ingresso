import type { Meta } from '@storybook/angular';
import { LayoutBar } from '../../../src/lib/layout-bar/layout-bar';
import bestPractices from './LayoutBarBestPractices.md?raw';
import description from './LayoutBarDescription.md?raw';

const meta: Meta<LayoutBar> = {
  title: 'Components/Layout bar',
  component: LayoutBar,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './LayoutBarDefault.stories';
export { Unavailable } from './LayoutBarUnavailable.stories';
