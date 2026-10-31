import type { StoryObj } from '@storybook/angular';
import { AppTile } from '../../../src/lib/app-tile/app-tile';

export const Default: StoryObj<AppTile> = {
  args: {
    name: 'Northwind Billing',
    url: 'https://billing.northwind.example',
    initial: 'NB',
    color: '#2563eb',
    size: 'large',
    openedLabel: 'Opened 8 minutes ago',
    editing: false,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:22rem"><ig-app-tile [name]="name" [url]="url" [initial]="initial" [color]="color" [size]="size" [openedLabel]="openedLabel" [editing]="editing" /></div>`,
  }),
};
