import type { StoryObj } from '@storybook/angular';
import { FieldSet } from '../../../src/lib/form/field-set';
import { Check, Choice } from '../../../src/lib/form/choice';

export const WithHint: StoryObj<FieldSet> = {
  render: () => ({
    moduleMetadata: { imports: [Check, Choice] },
    template: `<ig-field-set legend="Consent" controlId="first-party" hint="Only for apps you run yourself. People are never asked what it can see."><label ig-choice><input ig-check type="checkbox" />Trusted first-party app — skip the consent screen</label></ig-field-set>`,
  }),
};
