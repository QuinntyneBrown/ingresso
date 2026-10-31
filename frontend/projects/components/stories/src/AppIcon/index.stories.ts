import type { Meta } from '@storybook/angular';
import { AppIcon } from '../../../src/lib/app-icon/app-icon';
import bestPractices from './AppIconBestPractices.md?raw';
import description from './AppIconDescription.md?raw';

const meta: Meta<AppIcon> = {
  title: 'Components/AppIcon',
  component: AppIcon,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './AppIconDefault.stories';
export { Sizes } from './AppIconSizes.stories';
