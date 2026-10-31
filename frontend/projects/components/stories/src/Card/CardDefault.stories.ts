import type { StoryObj } from '@storybook/angular';
import { Card } from '../../../src/lib/card/card';

export const Default: StoryObj<Card> = {
  args: { title: 'Profile', level: 2, flush: false, interactive: false, selected: false },
  render: (args) => ({
    props: args,
    template: `<section ig-card [title]="title" [level]="level" [flush]="flush" [interactive]="interactive" [selected]="selected"><p class="text-muted">Shown in the greeting.</p></section>`,
  }),
};
