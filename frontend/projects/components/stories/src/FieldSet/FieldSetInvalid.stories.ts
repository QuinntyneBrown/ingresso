import type { StoryObj } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import { Check, Choice } from '../../../src/lib/form/choice';

export const Invalid: StoryObj<FieldSet> = {
  render: () => ({
    moduleMetadata: { imports: [Check, Choice] },
    template: `<ig-field-set legend="Category" controlId="category-bad" error="Pick at least one topic so people can find it."><label ig-choice><input ig-check type="checkbox" aria-invalid="true" aria-describedby="topics-bad-error" />Work</label></ig-field-set>`,
  }),
};
