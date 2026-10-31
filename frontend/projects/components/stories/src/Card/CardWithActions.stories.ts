import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { Card } from '../../../src/lib/card/card';

export const WithActions: StoryObj<Card> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<section ig-card title="Profile"><button ig-button appearance="ghost" size="sm" type="button" slot="actions">Edit</button><p class="text-muted">Shown in the dashboard greeting.</p><ng-container slot="footer"><button ig-button appearance="ghost" type="button">Cancel</button><button ig-button appearance="primary" type="button">Save changes</button></ng-container></section>`,
  }),
};
