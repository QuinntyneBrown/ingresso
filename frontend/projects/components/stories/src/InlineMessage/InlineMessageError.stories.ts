import type { StoryObj } from '@storybook/angular';
import { InlineMessage } from '../../../src/lib/inline-message/inline-message';

export const Error: StoryObj<InlineMessage> = {
  render: () => ({
    template: `<ig-inline-message kind="error" id="url-error">Enter a full address, like app.asana.com</ig-inline-message>`,
  }),
};
