import type { StoryObj } from '@storybook/angular';
import { Chip } from '../../../src/lib/chip/chip';
import { Cluster } from '../../../src/lib/layout/cluster';

/** A single-choice row: choosing a chip presses it and unpresses the others; choosing it again keeps it. */
export const Choice: StoryObj<Chip> = {
  render: () => ({
    props: { chosen: 'All', options: ['All', 'Sign-ins', 'App access', 'Sessions'] },
    moduleMetadata: { imports: [Cluster] },
    template: `<ig-cluster role="group" aria-label="Show">
      @for (option of options; track option) {
        <ig-chip choice [label]="option" [pressed]="chosen === option" (pressedChange)="chosen = option" />
      }
    </ig-cluster>`,
  }),
};
