import type { StoryObj } from '@storybook/angular';
import { AppTile } from '../../../src/lib/app-tile/app-tile';

export const Small: StoryObj<AppTile> = {
  args: {
    name: 'Statuspage',
    url: 'https://status.northwind.example',
    initial: 'S',
    color: '#1b6b3c',
    size: 'small',
    editing: false,
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:16rem"><ig-app-tile [name]="name" [url]="url" [initial]="initial" [color]="color" [size]="size" [editing]="editing" /></div>`,
  }),
};
