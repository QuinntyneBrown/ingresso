import type { StoryObj } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import { Check } from '../../../src/lib/form/choice';

export const Default: StoryObj<Choice> = {
  render: () => ({
    moduleMetadata: { imports: [Check] },
    template: `<label ig-choice><input ig-check type="checkbox" checked />Work</label>`,
  }),
};
