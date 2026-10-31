import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';

export const Appearances: StoryObj<Button> = {
  render: () => ({
    template: `<div class="cluster"><button ig-button type="button" appearance="primary">Add app</button><button ig-button type="button">Open the app</button><button ig-button type="button" appearance="ghost">Cancel</button><button ig-button type="button" appearance="link">Clear the search</button><button ig-button type="button" appearance="danger">Delete account</button></div>`,
  }),
};
