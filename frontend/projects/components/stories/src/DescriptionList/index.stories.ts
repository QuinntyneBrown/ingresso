import type { Meta } from '@storybook/angular';
import { DescriptionList } from '../../../src/lib/description-list/description-list';
import bestPractices from './DescriptionListBestPractices.md?raw';
import description from './DescriptionListDescription.md?raw';

const meta: Meta<DescriptionList> = {
  title: 'Components/Description list',
  component: DescriptionList,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './DescriptionListDefault.stories';
