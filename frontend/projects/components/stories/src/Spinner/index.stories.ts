import type { Meta } from '@storybook/angular';
import { Spinner } from '../../../src/lib/spinner/spinner';
import bestPractices from './SpinnerBestPractices.md?raw';
import description from './SpinnerDescription.md?raw';

const meta: Meta<Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SpinnerDefault.stories';
export { Sizes } from './SpinnerSizes.stories';
