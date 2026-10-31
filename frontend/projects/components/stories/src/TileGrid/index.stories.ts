import type { Meta } from '@storybook/angular';
import { TileGrid } from '../../../src/lib/tile-grid/tile-grid';
import bestPractices from './TileGridBestPractices.md?raw';
import description from './TileGridDescription.md?raw';

const meta: Meta<TileGrid> = {
  title: 'Components/TileGrid',
  component: TileGrid,
  parameters: {
    layout: 'padded',
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './TileGridDefault.stories';
export { Editing } from './TileGridEditing.stories';
export { Locked } from './TileGridLocked.stories';
export { ResizeLimits } from './TileGridResizeLimits.stories';
export { Collapsed } from './TileGridCollapsed.stories';
export { Empty } from './TileGridEmpty.stories';
