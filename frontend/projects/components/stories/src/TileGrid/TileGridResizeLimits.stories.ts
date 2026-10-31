import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { gridTemplate } from './TileGridFixtures';

/** Spans stay between 2 and 12 columns and 1 and 8 rows; a resize past a limit is announced. */
export const ResizeLimits: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({
    props: {
      layout: [
        { id: 'narrow', label: 'At the minimum width', x: 0, y: 0, cols: 2, rows: 2, minCols: 2, maxRows: 8 },
        { id: 'tall', label: 'At the maximum height', x: 3, y: 0, cols: 3, rows: 8, minCols: 2, maxRows: 8 },
      ],
      mode: 'edit',
    },
    template: gridTemplate(),
  }),
};
