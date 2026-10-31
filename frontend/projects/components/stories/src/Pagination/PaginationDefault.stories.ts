import type { StoryObj } from '@storybook/angular';
import { Pagination } from '../../../src/lib/pagination/pagination';

export const Default: StoryObj<Pagination> = {
  args: { page: 1, pageCount: 3 },
  render: (args) => ({
    props: args,
    template: `<div class="cluster"><ig-pagination [page]="page" [pageCount]="pageCount" (pageChange)="page = $event" /><span class="text-muted">Page {{ page }} of {{ pageCount }}</span></div>`,
  }),
};
