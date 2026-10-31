import type { Meta } from '@storybook/angular';
import { Menu } from '../../../src/lib/menu/menu';
import bestPractices from './MenuBestPractices.md?raw';
import description from './MenuDescription.md?raw';

const meta: Meta<Menu> = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './MenuDefault.stories';
export { Items } from './MenuItems.stories';
