import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Invalid: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<ig-form-field label="App name" controlId="title-bad" error="Enter a name for the app."><input ig-input id="title-bad" aria-invalid="true" aria-describedby="title-bad-error" /></ig-form-field>`,
  }),
};
