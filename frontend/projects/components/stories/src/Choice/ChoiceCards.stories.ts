import type { StoryObj } from '@storybook/angular';
import { Choice } from '../../../src/lib/form/choice';
import { Check } from '../../../src/lib/form/choice';

export const Cards: StoryObj<Choice> = {
  render: () => ({
    moduleMetadata: { imports: [Check] },
    template: `<div class="stack"><label ig-choice card hint="Shown as a large tile"><input ig-check type="radio" name="f" checked />Large</label><label ig-choice card hint="Shown as a compact tile"><input ig-check type="radio" name="f" />Compact</label></div>`,
  }),
};
