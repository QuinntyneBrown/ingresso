import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Tile, TileInput, TilePlacement, TILES_API } from 'api';
import { Observable, tap } from 'rxjs';
import { LoadStatus } from '../shared/load-state';

/** The dashboard's tiles and its view state (search, edit-layout mode). */
@Injectable({ providedIn: 'root' })
export class TilesStore {
  private readonly api = inject(TILES_API);

  readonly tiles = signal<Tile[]>([]);
  readonly status = signal<LoadStatus>('loading');
  readonly search = signal('');
  readonly editing = signal(false);
  private readonly highlightIndex = signal(0);

  readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.tiles();
    return this.tiles().filter((t) =>
      [t.name, t.url, t.description ?? '', t.category ?? ''].some((text) =>
        text.toLowerCase().includes(term),
      ),
    );
  });

  /** The match Enter opens: the first one when a search starts, then wherever the arrows have moved it. */
  readonly highlightedTile = computed(() => {
    if (!this.search().trim()) return null;
    const matches = this.visible();
    return matches[Math.min(this.highlightIndex(), matches.length - 1)] ?? null;
  });

  /** "2 apps match", read out politely as the results change. */
  readonly matchSummary = computed(() => {
    if (!this.search().trim()) return '';
    const count = this.visible().length;
    return count === 0 ? 'No apps match' : count === 1 ? '1 app matches' : `${count} apps match`;
  });

  constructor() {
    effect(() => {
      this.search();
      this.highlightIndex.set(0);
    });
  }

  /** Moves the highlight by one match, wrapping at both ends. */
  moveHighlight(step: 1 | -1): void {
    const count = this.visible().length;
    if (count === 0) return;
    this.highlightIndex.update((i) => (Math.min(i, count - 1) + step + count) % count);
  }

  load(): void {
    this.status.set('loading');
    this.api.list().subscribe({
      next: (tiles) => {
        this.tiles.set(sorted(tiles));
        this.status.set('loaded');
      },
      error: () => this.status.set('failed'),
    });
  }

  create(input: TileInput): Observable<Tile> {
    return this.api.create(input).pipe(tap((tile) => this.tiles.update((list) => sorted([...list, tile]))));
  }

  update(id: string, input: TileInput): Observable<Tile> {
    return this.api
      .update(id, input)
      .pipe(tap((tile) => this.tiles.update((list) => list.map((t) => (t.id === id ? tile : t)))));
  }

  remove(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.tiles.update((list) => list.filter((t) => t.id !== id))));
  }

  /** Applies the new layout at once and restores the old one if saving fails (L2-016, L2-041). */
  saveLayout(placements: TilePlacement[]): Observable<Tile[]> {
    const before = this.tiles();
    const byId = new Map(placements.map((p) => [p.id, p]));
    this.tiles.set(sorted(before.map((t) => ({ ...t, ...byId.get(t.id) }))));
    return new Observable<Tile[]>((subscriber) =>
      this.api.saveLayout(placements).subscribe({
        next: (tiles) => {
          this.tiles.set(sorted(tiles));
          subscriber.next(tiles);
          subscriber.complete();
        },
        error: (error: unknown) => {
          this.tiles.set(before);
          subscriber.error(error);
        },
      }),
    );
  }

  resetLayout(): Observable<Tile[]> {
    return this.api.resetLayout().pipe(tap((tiles) => this.tiles.set(sorted(tiles))));
  }

  markOpened(id: string): void {
    this.api.markOpened(id).subscribe({
      next: (tile) => this.tiles.update((list) => list.map((t) => (t.id === id ? tile : t))),
      error: () => undefined,
    });
  }
}

/** Reading order: top row first, then left to right. */
const sorted = (tiles: Tile[]): Tile[] => [...tiles].sort((a, b) => a.y - b.y || a.x - b.x);
