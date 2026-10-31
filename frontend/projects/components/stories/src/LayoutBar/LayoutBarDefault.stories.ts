import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';
import { LayoutBar } from '../../../src/lib/layout-bar/layout-bar';

export const Default: StoryObj<LayoutBar> = {
  args: { unavailable: false },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [Button, Icon] },
    template: `<ig-layout-bar [unavailable]="unavailable"><button ig-button appearance="ghost" size="sm" type="button"><ig-icon name="undo" />Reset layout</button><button ig-button appearance="primary" size="sm" type="button">Done</button></ig-layout-bar>`,
  }),
};
