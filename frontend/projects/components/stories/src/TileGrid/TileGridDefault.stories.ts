import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { DASHBOARD_LAYOUT, gridTemplate } from './TileGridFixtures';

export const Default: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({
    props: { layout: DASHBOARD_LAYOUT, mode: 'live' },
    template: gridTemplate(),
  }),
};
