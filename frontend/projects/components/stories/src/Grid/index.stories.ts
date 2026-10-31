import type { Meta } from '@storybook/angular';
import { Grid } from '../../../src/lib/layout/grid';
import bestPractices from './GridBestPractices.md?raw';
import description from './GridDescription.md?raw';

const meta: Meta<Grid> = {
  title: 'Components/Grid',
  component: Grid,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './GridDefault.stories';
export { Auto } from './GridAuto.stories';
