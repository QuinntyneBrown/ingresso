import type { StoryObj } from '@storybook/angular';
import { Alert } from '../../../src/lib/alert/alert';

export const Kinds: StoryObj<Alert> = {
  render: () => ({
    template: `<div class="stack"><ig-alert kind="info" title="ingresso was updated">Refresh to get the newest apps and fixes.</ig-alert><ig-alert kind="success" title="You're back online" dismissible>Events are up to date as of 10:14 AM.</ig-alert><ig-alert kind="warning" title="You're offline" announce="status">Submitting and feeds need a connection.</ig-alert><ig-alert kind="danger" title="We couldn't load your apps" announce="alert">ingresso didn't respond in time. Your filters are kept.</ig-alert></div>`,
  }),
};
