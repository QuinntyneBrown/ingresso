import type { StoryObj } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';

export const SiteBanner: StoryObj<Alert> = {
  render: () => ({
    props: { actions: [{ label: 'Retry now', run: () => undefined }] },
    template: `<ig-alert banner kind="danger" announce="alert" title="We can't reach ingresso" [actions]="actions">Retrying in 30 seconds. The events below may be out of date.</ig-alert>`,
  }),
};
