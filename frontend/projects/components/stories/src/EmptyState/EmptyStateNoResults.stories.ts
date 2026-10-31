import type { StoryObj } from '@storybook/angular';
import { EmptyState } from '../../../src/lib/empty-state/empty-state';
import { Button } from '../../../src/lib/button/button';

export const NoResults: StoryObj<EmptyState> = {
  render: () => ({
    moduleMetadata: { imports: [Button] },
    template: `<ig-empty-state icon="search-x" title="No apps match that search"><span slot="text">Try another name or address.</span><ng-container slot="actions"><button ig-button appearance="primary" type="button">Clear the search</button><a ig-button href="#">Show all apps</a></ng-container></ig-empty-state>`,
  }),
};
