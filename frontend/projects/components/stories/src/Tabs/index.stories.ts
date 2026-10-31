import type { Meta } from '@storybook/angular';
import { Tabs } from '../../../src/lib/tabs/tabs';
import bestPractices from './TabsBestPractices.md?raw';
import description from './TabsDescription.md?raw';

const meta: Meta<Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TabsDefault.stories';
export { Disabled } from './TabsDisabled.stories';
