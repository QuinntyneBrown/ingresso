import type { StoryObj } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';

export const Default: StoryObj<Alert> = {
  args: { kind: 'info', title: 'Layout saved' },
  render: (args) => ({
    props: args,
    template: `<ig-alert [kind]="kind" [title]="title">Your tiles keep their order on every device.</ig-alert>`,
  }),
};
