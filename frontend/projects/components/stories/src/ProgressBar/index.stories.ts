import type { Meta } from '@storybook/angular';
import { ProgressBar } from '../../../src/lib/progress-bar/progress-bar';
import bestPractices from './ProgressBarBestPractices.md?raw';
import description from './ProgressBarDescription.md?raw';

const meta: Meta<ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ProgressBarDefault.stories';
export { Indeterminate } from './ProgressBarIndeterminate.stories';
export { Success } from './ProgressBarSuccess.stories';
