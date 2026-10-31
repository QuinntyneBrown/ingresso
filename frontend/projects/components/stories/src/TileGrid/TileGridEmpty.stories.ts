import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import { TileGridTile } from '../../../src/lib/tile-grid/tile-grid-tile';
import { gridTemplate } from './TileGridFixtures';

/** An empty layout renders nothing and takes no height; the page shows its empty state instead. */
export const Empty: StoryObj<TileGrid> = {
  decorators: [moduleMetadata({ imports: [TileGridTile] })],
  render: () => ({ props: { layout: [], mode: 'live' }, template: gridTemplate() }),
};
