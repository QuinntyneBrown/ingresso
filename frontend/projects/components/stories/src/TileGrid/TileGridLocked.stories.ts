import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { DASHBOARD_LAYOUT, gridTemplate } from './TileGridFixtures';

/** A locked tile keeps its cells in edit mode; the others move around it. */
export const Locked: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({
    props: {
      layout: DASHBOARD_LAYOUT.map((tile) => (tile.id === 'slack' ? { ...tile, locked: true } : tile)),
      mode: 'edit',
    },
    template: gridTemplate(),
  }),
};
