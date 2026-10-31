import type { StoryObj } from '@storybook/angular';
import { AppTile } from '../../../src/lib/app-tile/app-tile';

export const Editing: StoryObj<AppTile> = {
  args: {
    name: 'Northwind Billing',
    url: 'https://billing.northwind.example',
    initial: 'NB',
    color: '#2563eb',
    size: 'small',
    editing: true,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:16rem"><ig-app-tile [name]="name" [url]="url" [initial]="initial" [color]="color" [size]="size" [editing]="editing" /></div>`,
  }),
};
