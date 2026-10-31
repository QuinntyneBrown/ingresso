import type { StoryObj } from '@storybook/angular';
import { Grid } from '../../../src/lib/layout/grid';
import { Badge } from '../../../src/lib/badge/badge';

export const Auto: StoryObj<Grid> = {
  render: () => ({
    moduleMetadata: { imports: [Badge] },
    template: `<ig-grid auto><ig-badge>a</ig-badge><ig-badge>b</ig-badge><ig-badge>c</ig-badge></ig-grid>`,
  }),
};
