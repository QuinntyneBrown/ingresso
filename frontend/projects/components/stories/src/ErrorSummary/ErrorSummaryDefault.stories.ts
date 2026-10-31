import type { StoryObj } from '@storybook/angular';
import { ErrorSummary } from '../../../src/lib/form/error-summary';

export const Default: StoryObj<ErrorSummary> = {
  render: () => ({
    props: {
      errors: [
        { controlId: 'title', message: 'Enter a name for the app.' },
        { controlId: 'url', message: 'Enter a full web address, such as https://app.example.com.' },
        { controlId: 'color', message: 'Pick a colour for the icon.' },
      ],
    },
    template: `<ig-error-summary [errors]="errors" />`,
  }),
};
