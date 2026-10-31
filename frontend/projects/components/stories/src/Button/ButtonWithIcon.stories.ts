import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';

export const WithIcon: StoryObj<Button> = {
  render: () => ({
    moduleMetadata: { imports: [Icon] },
    template: `<div class="cluster"><a ig-button appearance="primary" href="#"><ig-icon name="plus" />Add app</a><button ig-button type="button" appearance="ghost" iconOnly aria-label="Open menu"><ig-icon name="menu" /></button></div>`,
  }),
};
