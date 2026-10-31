import type { StoryObj } from '@storybook/angular';
import { TabPanel, Tabs } from '../../../src/lib/tabs/tabs';

export const Disabled: StoryObj<Tabs> = {
  render: () => ({
    moduleMetadata: { imports: [TabPanel] },
    template: `<ig-tabs label="Apps">
        <ig-tab-panel label="All">All of your apps.</ig-tab-panel>
        <ig-tab-panel label="Shared" disabled>Shared apps are not available yet.</ig-tab-panel>
        <ig-tab-panel label="Recent">The apps you opened in the last week.</ig-tab-panel>
      </ig-tabs>`,
  }),
};
