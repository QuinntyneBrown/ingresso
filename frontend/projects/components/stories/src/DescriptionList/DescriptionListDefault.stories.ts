import type { StoryObj } from '@storybook/angular';
import { DescriptionList } from '../../../src/lib/description-list/description-list';

export const Default: StoryObj<DescriptionList> = {
  args: {
    items: [
      { term: 'Address', description: 'linear.app', mono: true },
      { term: 'Last opened', description: '52 minutes ago' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `<ig-description-list [items]="items" />`,
  }),
};
