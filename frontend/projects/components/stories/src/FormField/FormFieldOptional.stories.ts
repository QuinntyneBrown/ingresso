import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Optional: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<ig-form-field label="Description" controlId="stream" optional hint="Shown under the name on large tiles."><input ig-input id="stream" type="url" placeholder="https://" aria-describedby="stream-help" /></ig-form-field>`,
  }),
};
