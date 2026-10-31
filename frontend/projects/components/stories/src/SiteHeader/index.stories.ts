import type { Meta } from '@storybook/angular';
import { SiteHeader } from '../../../src/lib/site-header/site-header';
import bestPractices from './SiteHeaderBestPractices.md?raw';
import description from './SiteHeaderDescription.md?raw';

const meta: Meta<SiteHeader> = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SiteHeaderDefault.stories';
