/** One app tile on the dashboard, as the API returns it. */
export interface Tile {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  /** The icon colour, a `#rrggbb` hex string. */
  color: string;
  /** One or two characters shown in the icon. */
  initial: string;
  category?: string | null;
  /** ISO 8601 instant; absent when the app was never opened from ingresso. */
  lastOpenedAt?: string | null;
  createdAt: string;
  /** Column of the top-left cell on the 12-column grid, from 0. */
  x: number;
  /** Row of the top-left cell, from 0. */
  y: number;
  /** Column span. */
  cols: number;
  /** Row span. */
  rows: number;
}

/** One tile's cells, as saved by `TilesApi.saveLayout`. */
export interface TilePlacement {
  id: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/** What a person supplies to create or edit a tile. */
export interface TileInput {
  name: string;
  url: string;
  description?: string | null;
  color: string;
  initial: string;
  category?: string | null;
}
