import type { StoryObj } from '@storybook/angular';
import { Toast } from '../../../src/lib/toast/toast';

const toast = (id: number, kind: string, title: string, text: string) => ({
  id,
  kind,
  title,
  text,
  remainingMs: kind === 'danger' ? null : 8000,
  paused: true,
});

export const Kinds: StoryObj<Toast> = {
  render: () => ({
    props: {
      toasts: [
        toast(1, 'info', 'Layout saved', 'Your tiles keep their order on every device.'),
        toast(2, 'success', 'App added', 'Northwind Billing is on your dashboard.'),
        toast(3, 'warning', 'Saving is slow', 'Your app is saved; the icon finishes shortly.'),
        toast(4, 'danger', "Couldn't copy the link", 'Select the link and copy it manually.'),
      ],
    },
    template: `<div class="stack" style="max-width: 24rem">
      @for (t of toasts; track t.id) { <ig-toast [toast]="t" /> }
    </div>`,
  }),
};
