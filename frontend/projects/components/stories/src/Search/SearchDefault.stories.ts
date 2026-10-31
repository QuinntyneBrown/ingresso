import type { StoryObj } from '@storybook/angular';
import { Search } from '../../../src/lib/search/search';

export const Default: StoryObj<Search> = {
  args: { label: 'Jump to an app', placeholder: 'Jump to an app', shortcut: '/' },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:28rem"><ig-search [label]="label" [placeholder]="placeholder" [shortcut]="shortcut" /></div>`,
  }),
};
