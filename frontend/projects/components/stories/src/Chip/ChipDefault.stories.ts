import type { StoryObj } from '@storybook/angular';
import { Chip } from '../../../src/lib/chip/chip';

export const Default: StoryObj<Chip> = {
  args: { label: 'Recent', pressed: true },
  render: (args) => ({
    props: args,
    template: `<ig-chip [label]="label" [(pressed)]="pressed" />`,
  }),
};
