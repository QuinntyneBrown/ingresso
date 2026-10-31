import type { StoryObj } from '@storybook/angular';
import { ButtonGroup } from '../../../src/lib/button-group/button-group';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<ButtonGroup> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<ig-button-group label="View"><button ig-button size="sm" type="button">List</button><button ig-button size="sm" type="button" aria-pressed="true">Month</button></ig-button-group>`,
  }),
};
