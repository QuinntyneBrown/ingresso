import type { Meta } from '@storybook/angular';
import { Chip } from '../../../src/lib/chip/chip';
import bestPractices from './ChipBestPractices.md?raw';
import description from './ChipDescription.md?raw';

const meta: Meta<Chip> = {
  title: 'Components/Chip',
  component: Chip,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './ChipDefault.stories';
export { Filters } from './ChipFilters.stories';
export { Removable } from './ChipRemovable.stories';
