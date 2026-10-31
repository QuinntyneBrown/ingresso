import type { Meta } from '@storybook/angular';
import { Link } from '../../../src/lib/link/link';
import bestPractices from './LinkBestPractices.md?raw';
import description from './LinkDescription.md?raw';

const meta: Meta<Link> = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './LinkDefault.stories';
export { Back } from './LinkBack.stories';
export { External } from './LinkExternal.stories';
