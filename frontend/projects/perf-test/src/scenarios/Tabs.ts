import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TabPanel, Tabs } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-tabs-scenario',
  imports: [Tabs, TabPanel],
  template: `@for (i of items(); track i) {
    <ig-tabs label="Apps">
      <ig-tab-panel label="All" [count]="11">All eleven apps.</ig-tab-panel>
      <ig-tab-panel label="Recent">Recently opened apps.</ig-tab-panel>
    </ig-tabs>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabsScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Tabs', component: TabsScenario };
