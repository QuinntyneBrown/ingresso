import type { StoryObj } from '@storybook/angular';
import { Breadcrumb } from '../../../src/lib/breadcrumb/breadcrumb';

export const Default: StoryObj<Breadcrumb> = {
  args: {
    items: [{ label: 'Apps', href: '#' }, { label: 'Directory', href: '#' }, { label: 'Asana' }],
  },
  render: (args) => ({
    props: args,
    template: `<ig-breadcrumb [items]="items" />`,
  }),
};
