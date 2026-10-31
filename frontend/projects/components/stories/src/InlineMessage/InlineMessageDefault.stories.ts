import type { StoryObj } from '@storybook/angular';
import { InlineMessage } from '../../../src/lib/inline-message/inline-message';

export const Default: StoryObj<InlineMessage> = {
  args: { kind: 'help' },
  render: (args) => ({
    props: args,
    template: `<ig-inline-message [kind]="kind">Shown under the name on the tile.</ig-inline-message>`,
  }),
};
