import type { StoryObj } from '@storybook/angular';
import { StatusPage } from '../../../src/lib/status-page/status-page';
import { Button } from '../../../src/lib/button/button';
import { Icon } from '../../../src/lib/icon/icon';

export const Offline: StoryObj<StatusPage> = {
  render: () => ({
    moduleMetadata: { imports: [Button, Icon] },
    template: `<ig-status-page heading="You’re offline"><ig-icon slot="icon" name="wifi-off" /><p slot="message">ingresso needs a connection the first time. Reconnect and we’ll pick up where you left off.</p><ng-container slot="actions"><button ig-button type="button" appearance="primary">Try again</button></ng-container></ig-status-page>`,
  }),
};
