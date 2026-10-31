import type { StoryObj } from '@storybook/angular';
import { FormSection } from '../../../src/lib/form/form-section';

export const Default: StoryObj<FormSection> = {
  render: () => ({
    template: `<ig-form-section title="App details" sectionId="basics" lead="This is what people see in the list."><p>Fields go here.</p></ig-form-section>`,
  }),
};
