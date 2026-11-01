import type { StoryObj } from '@storybook/angular';
import { Button } from '../../../src/lib/button/button';
import { List, ListItem } from '../../../src/lib/list/list';

export const WithDetail: StoryObj<List> = {
  render: () => ({
    moduleMetadata: { imports: [Button, ListItem] },
    template: `<ul ig-list surface aria-label="Connected apps"><li ig-list-item wrap title="Sample app" meta="Can see your display name and email address" detail="Approved 12 Oct 2026 · Last used 2 hours ago"><button slot="action" ig-button size="sm" type="button">Revoke</button></li><li ig-list-item wrap title="Notes" meta="Can see your email address" detail="Approved 3 Sep 2026 · Not used yet"><button slot="action" ig-button size="sm" type="button">Revoke</button></li></ul>`,
  }),
};
