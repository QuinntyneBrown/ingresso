import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { DASHBOARD_LAYOUT, gridTemplate } from './TileGridFixtures';

/**
 * View this story in a canvas narrower than 1024px: tiles flow in reading order (two columns
 * from 768px, one below) and edit mode is unavailable, while the saved layout is unchanged.
 */
export const Collapsed: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({
    props: {
      layout: [
        { id: 'wide', label: 'A tile 6 columns wide takes a full row', x: 0, y: 5, cols: 6, rows: 2 },
        ...DASHBOARD_LAYOUT,
      ],
      mode: 'edit',
    },
    template: `<div style="max-inline-size:60rem">${gridTemplate()}</div>`,
  }),
};
