import type { StoryObj } from '@storybook/angular';
import { EmptyState } from '../../../src/lib/empty-state/empty-state';
import { Button } from '../../../src/lib/button/button';

export const Default: StoryObj<EmptyState> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<ig-empty-state icon="calendar" title="No apps behind this door yet"><span slot="text">Add your first app and it shows up here as a tile.</span><ng-container slot="actions"><a ig-button appearance="primary" href="#">Add your first app</a><a ig-button href="#">Browse the directory</a></ng-container></ig-empty-state>`,
  }),
};
