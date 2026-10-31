import type { StoryObj } from '@storybook/angular';
import { SiteFooter } from '../../../src/lib/site-footer/site-footer';

export const Default: StoryObj<SiteFooter> = {
  args: { note: 'Apps open in a new tab. ingresso never sees what you do inside them.' },
  render: (args) => ({
    props: args,
    template: `<ig-site-footer [note]="note"><a slot="links" href="#">Brand guide</a></ig-site-footer>`,
  }),
};
