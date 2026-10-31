import type { StoryObj } from '@storybook/angular';
import { Search } from '../../../src/lib/search/search';

export const WithValue: StoryObj<Search> = {
  render: () => ({
    template: `<div style="max-width:28rem"><ig-search value="bill" /></div>`,
  }),
};
