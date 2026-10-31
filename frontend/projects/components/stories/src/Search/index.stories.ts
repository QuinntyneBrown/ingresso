import type { Meta } from '@storybook/angular';
import { Search } from '../../../src/lib/search/search';
import bestPractices from './SearchBestPractices.md?raw';
import description from './SearchDescription.md?raw';

const meta: Meta<Search> = {
  title: 'Components/Search',
  component: Search,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SearchDefault.stories';
export { WithValue } from './SearchWithValue.stories';
