import type { StoryObj } from '@storybook/angular';
import { Pagination } from '../../../src/lib/pagination/pagination';

export const ManyPages: StoryObj<Pagination> = {
  args: { page: 6, pageCount: 12 },
  render: (args) => ({
    props: args,
    template: `<ig-pagination [page]="page" [pageCount]="pageCount" (pageChange)="page = $event" />`,
  }),
};
