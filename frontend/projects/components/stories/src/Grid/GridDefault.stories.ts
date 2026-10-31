import type { StoryObj } from '@storybook/angular';
import { Grid } from '../../../src/lib/layout/grid';
import { Badge } from '../../../src/lib/badge/badge';

export const Default: StoryObj<Grid> = {
  render: () => ({
    moduleMetadata: { imports: [Badge] },
    template: `<ig-grid><ig-badge>1</ig-badge><ig-badge>2</ig-badge><ig-badge>3</ig-badge><ig-badge>4</ig-badge></ig-grid>`,
  }),
};
