import type { StoryObj } from '@storybook/angular';
import { Stack } from '../../../src/lib/layout/stack';
import { Badge } from '../../../src/lib/badge/badge';

export const Default: StoryObj<Stack> = {
  args: { gap: 'md' },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [Badge] },
    template: `<ig-stack [gap]="gap"><ig-badge>one</ig-badge><ig-badge>two</ig-badge><ig-badge>three</ig-badge></ig-stack>`,
  }),
};
