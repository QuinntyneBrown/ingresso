import type { StoryObj } from '@storybook/angular';
import { Tooltip } from '../../../src/lib/tooltip/tooltip';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';

export const Default: StoryObj<Tooltip> = {
  render: () => ({
    moduleMetadata: { imports: [Button, Icon] },
    template: `<div style="padding: 3rem;"><button ig-button appearance="ghost" iconOnly type="button" class="has-tooltip" aria-label="Notifications"><ig-icon name="bell" /><ig-tooltip>Notifications</ig-tooltip></button></div>`,
  }),
};
