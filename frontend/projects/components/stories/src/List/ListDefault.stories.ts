import type { StoryObj } from '@storybook/angular';
import { List, ListItem } from '../../../src/lib/list/list';

export const Default: StoryObj<List> = {
  args: { variant: 'simple', surface: true },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [ListItem] },
    template: `<ul ig-list [variant]="variant" [surface]="surface"><li ig-list-item title="Gmail" meta="mail.google.com"></li><li ig-list-item title="Slack" meta="northwind.slack.com"></li><li ig-list-item title="Linear" meta="linear.app"></li></ul>`,
  }),
};
