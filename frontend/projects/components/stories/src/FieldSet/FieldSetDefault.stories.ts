import type { StoryObj } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import { Check, Choice } from '../../../src/lib/form/choice';

export const Default: StoryObj<FieldSet> = {
  render: () => ({
    moduleMetadata: { imports: [Check, Choice] },
    template: `<ig-field-set legend="Category" controlId="category"><label ig-choice><input ig-check type="checkbox" />Work</label><label ig-choice><input ig-check type="checkbox" />Personal</label></ig-field-set>`,
  }),
};
