import type { StoryObj } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';

export const Default: StoryObj<Toast> = {
  render: () => ({
    props: {
      toast: {
        id: 1,
        kind: 'info',
        title: 'Layout saved',
        text: 'Your tiles keep their order on every device.',
        remainingMs: 8000,
        paused: true,
      },
    },
    template: `<div style="max-width: 24rem"><ig-toast [toast]="toast" /></div>`,
  }),
};
