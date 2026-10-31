import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AppTile } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'ig-app-tile-scenario',
  imports: [AppTile],
  template: `@for (i of items(); track i) {
    <ig-app-tile
      name="Northwind Billing"
      url="https://billing.northwind.example"
      initial="NB"
      color="#2563eb"
      size="large"
      openedLabel="Opened 8 minutes ago"
    />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppTileScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'AppTile', component: AppTileScenario };
