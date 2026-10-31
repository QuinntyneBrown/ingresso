import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { DASHBOARD_LAYOUT, gridTemplate, withLimits } from './TileGridFixtures';

/** Edit mode: drag a tile to free cells, drag its corner to resize, or use the arrow keys. */
export const Editing: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({
    props: { layout: withLimits(DASHBOARD_LAYOUT), mode: 'edit' },
    template: gridTemplate(),
  }),
};
