import type { Meta } from '@storybook/angular';
import { Breadcrumb } from '../../../src/lib/breadcrumb/breadcrumb';
import bestPractices from './BreadcrumbBestPractices.md?raw';
import description from './BreadcrumbDescription.md?raw';

const meta: Meta<Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './BreadcrumbDefault.stories';
