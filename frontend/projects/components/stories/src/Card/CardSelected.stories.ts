import type { StoryObj } from '@storybook/angular';
import { Card } from '../../../src/lib/card/card';

export const Selected: StoryObj<Card> = {
  render: () => ({
    template: `<div class="cluster"><div ig-card title="Light" [level]="3"></div><div ig-card selected title="Dark" [level]="3"></div></div>`,
  }),
};
