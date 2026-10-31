import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';
import { Tile, TileInput, TilePlacement } from './tile';

export interface TilesApi {
  /** Every tile. */
  list(): Observable<Tile[]>;
  get(id: string): Observable<Tile>;
  create(input: TileInput): Observable<Tile>;
  update(id: string, input: TileInput): Observable<Tile>;
  delete(id: string): Observable<void>;
  /** Saves the whole layout: every tile's cells. Answers the tiles in reading order. */
  saveLayout(tiles: TilePlacement[]): Observable<Tile[]>;
  /** Records that the tile was opened now. */
  markOpened(id: string): Observable<Tile>;
  /** Restores the default layout (creation order at 3 by 2). Answers the tiles in reading order. */
  resetLayout(): Observable<Tile[]>;
}

export const TILES_API = new InjectionToken<TilesApi>('TILES_API');

@Injectable()
export class HttpTilesApi implements TilesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get path(): string {
    return `${this.baseUrl}/api/tiles`;
  }

  list(): Observable<Tile[]> {
    return this.http.get<Tile[]>(this.path);
  }

  get(id: string): Observable<Tile> {
    return this.http.get<Tile>(`${this.path}/${encodeURIComponent(id)}`);
  }

  create(input: TileInput): Observable<Tile> {
    return this.http.post<Tile>(this.path, input);
  }

  update(id: string, input: TileInput): Observable<Tile> {
    return this.http.put<Tile>(`${this.path}/${encodeURIComponent(id)}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.path}/${encodeURIComponent(id)}`);
  }

  saveLayout(tiles: TilePlacement[]): Observable<Tile[]> {
    return this.http.put<Tile[]>(`${this.path}/layout`, { tiles });
  }

  markOpened(id: string): Observable<Tile> {
    return this.http.post<Tile>(`${this.path}/${encodeURIComponent(id)}/opened`, {});
  }

  resetLayout(): Observable<Tile[]> {
    return this.http.post<Tile[]>(`${this.path}/reset-layout`, {});
  }
}
