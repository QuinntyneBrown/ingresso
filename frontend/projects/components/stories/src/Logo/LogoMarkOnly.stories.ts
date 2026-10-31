import type { StoryObj } from '@storybook/angular';
import { Logo } from '../../../src/lib/logo/logo';

export const MarkOnly: StoryObj<Logo> = {
  render: () => ({
    template: `<ig-logo [wordmark]="false" size="lg" label="ingresso" />`,
  }),
};
