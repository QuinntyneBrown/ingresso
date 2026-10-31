import type { Meta } from '@storybook/angular';
import { AppTile } from '../../../src/lib/app-tile/app-tile';
import bestPractices from './AppTileBestPractices.md?raw';
import description from './AppTileDescription.md?raw';

const meta: Meta<AppTile> = {
  title: 'Components/AppTile',
  component: AppTile,
  parameters: {
    docs: { description: { component: [description, bestPractices].join('\n') } },
  },
};

export default meta;

export { Default } from './AppTileDefault.stories';
export { Small } from './AppTileSmall.stories';
export { Editing } from './AppTileEditing.stories';
export { Highlighted } from './AppTileHighlighted.stories';
