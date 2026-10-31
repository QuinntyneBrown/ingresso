import type { Meta } from '@storybook/angular';
import { Card } from '../../../src/lib/card/card';
import bestPractices from './CardBestPractices.md?raw';
import description from './CardDescription.md?raw';

const meta: Meta<Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './CardDefault.stories';
export { WithActions } from './CardWithActions.stories';
export { Selected } from './CardSelected.stories';
