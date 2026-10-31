import type { StoryObj } from '@storybook/angular';
import { Badge } from '../../../src/lib/badge/badge';

export const Default: StoryObj<Badge> = {
  args: { kind: 'warning' },
  render: (args) => ({
    props: args,
    template: `<ig-badge [kind]="kind">Waitlist open</ig-badge>`,
  }),
};
