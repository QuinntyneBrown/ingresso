import type { Meta } from '@storybook/angular';
import { SiteFooter } from '../../../src/lib/site-footer/site-footer';
import bestPractices from './SiteFooterBestPractices.md?raw';
import description from './SiteFooterDescription.md?raw';

const meta: Meta<SiteFooter> = {
  title: 'Components/SiteFooter',
  component: SiteFooter,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './SiteFooterDefault.stories';
