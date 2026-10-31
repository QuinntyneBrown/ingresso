import type { StoryObj } from '@storybook/angular';
import { Chip } from '../../../src/lib/chip/chip';

export const Removable: StoryObj<Chip> = {
  render: () => ({
    template: `<ig-chip label="Work" removable />`,
  }),
};
