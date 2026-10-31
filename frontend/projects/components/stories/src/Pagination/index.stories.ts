import type { Meta } from '@storybook/angular';
import { Pagination } from '../../../src/lib/pagination/pagination';
import bestPractices from './PaginationBestPractices.md?raw';
import description from './PaginationDescription.md?raw';

const meta: Meta<Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './PaginationDefault.stories';
export { ManyPages } from './PaginationManyPages.stories';
