import type { Meta } from '@storybook/angular';
import { Logo } from '../../../src/lib/logo/logo';
import bestPractices from './LogoBestPractices.md?raw';
import description from './LogoDescription.md?raw';

const meta: Meta<Logo> = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './LogoDefault.stories';
export { MarkOnly } from './LogoMarkOnly.stories';
