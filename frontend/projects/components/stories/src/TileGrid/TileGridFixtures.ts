import type { TileGridItem } from '../../../src/lib/tile-grid/grid-tile';

/** Apps placed the way the dashboard mock shows them: three large tiles, then small ones. */
export const DASHBOARD_LAYOUT: TileGridItem[] = [
  { id: 'gmail', label: 'Gmail', x: 0, y: 0, cols: 4, rows: 3 },
  { id: 'slack', label: 'Slack', x: 4, y: 0, cols: 4, rows: 3 },
  { id: 'linear', label: 'Linear', x: 8, y: 0, cols: 4, rows: 3 },
  { id: 'github', label: 'GitHub', x: 0, y: 3, cols: 3, rows: 2 },
  { id: 'figma', label: 'Figma', x: 3, y: 3, cols: 3, rows: 2 },
  { id: 'notion', label: 'Notion', x: 6, y: 3, cols: 3, rows: 2 },
  { id: 'zoom', label: 'Zoom', x: 9, y: 3, cols: 3, rows: 2 },
];

/** ingresso's size limits (L2-051), applied to every tile. */
export const withLimits = (layout: TileGridItem[]): TileGridItem[] =>
  layout.map((tile) => ({ ...tile, minCols: 2, minRows: 1, maxCols: 12, maxRows: 8 }));

/** The tile template every story projects: a plain card naming the app. */
export const TILE_TEMPLATE = `<ng-template igTileGridTile let-tile>
  <div style="block-size:100%;padding:var(--spacingVerticalM) var(--spacingHorizontalM);font:var(--ig-text-label)">{{ tile.label }}</div>
</ng-template>`;

export const gridTemplate = (attrs = ''): string =>
  `<ig-tile-grid aria-label="Your apps" [layout]="layout" [mode]="mode" (layoutChange)="layout = $event" ${attrs}>${TILE_TEMPLATE}</ig-tile-grid>`;
