import type { StoryObj } from '@storybook/angular';
import { FormField } from '../../../src/lib/form/form-field';
import { Input } from '../../../src/lib/form/input';

export const Default: StoryObj<FormField> = {
  render: () => ({
    moduleMetadata: { imports: [Input] },
    template: `<ig-form-field label="App name" controlId="title" hint="Up to 90 characters. Say what people will learn."><input ig-input id="title" aria-describedby="title-help" /></ig-form-field>`,
  }),
};
