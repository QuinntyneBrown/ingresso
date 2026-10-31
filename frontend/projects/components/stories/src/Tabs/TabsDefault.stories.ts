import type { StoryObj } from '@storybook/angular';
import { TabPanel, Tabs } from '../../../src/lib/tabs/tabs';

export const Default: StoryObj<Tabs> = {
  args: { selectedIndex: 0 },
  render: (args) => ({
    props: args,
    moduleMetadata: { imports: [TabPanel] },
    template: `<ig-tabs label="Apps" [(selectedIndex)]="selectedIndex">
        <ig-tab-panel label="All" [count]="11">All eleven apps on your dashboard.</ig-tab-panel>
        <ig-tab-panel label="Recent">The apps you opened in the last week.</ig-tab-panel>
      </ig-tabs>`,
  }),
};
