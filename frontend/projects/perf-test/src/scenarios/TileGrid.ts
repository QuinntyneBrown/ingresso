import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TileGrid, TileGridItem, TileGridTile } from 'components';
import { Scenario } from './scenario';

/** Renders one grid holding `items().length` tiles, four per row at 3 by 2 (ingresso caps a user at 200). */
@Component({
  selector: 'ig-tile-grid-scenario',
  imports: [TileGrid, TileGridTile],
  template: `<ig-tile-grid aria-label="Your apps" [layout]="layout()" mode="edit">
    <ng-template igTileGridTile let-tile>{{ tile.label }}</ng-template>
  </ig-tile-grid>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TileGridScenario {
  readonly items = input.required<number[]>();
  protected readonly layout = computed<TileGridItem[]>(() =>
    this.items().map((i) => ({
      id: `tile-${i}`,
      label: `App ${i + 1}`,
      x: (i % 4) * 3,
      y: Math.floor(i / 4) * 2,
      cols: 3,
      rows: 2,
    })),
  );
}

export const scenario: Scenario = { name: 'TileGrid', component: TileGridScenario };
