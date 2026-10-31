import type { Meta } from '@storybook/angular';
import { InlineMessage } from '../../../src/lib/inline-message/inline-message';
import bestPractices from './InlineMessageBestPractices.md?raw';
import description from './InlineMessageDescription.md?raw';

const meta: Meta<InlineMessage> = {
  title: 'Components/InlineMessage',
  component: InlineMessage,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './InlineMessageDefault.stories';
export { Error } from './InlineMessageError.stories';
