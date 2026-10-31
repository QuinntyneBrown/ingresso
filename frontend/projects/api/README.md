# api

Typed clients for the ingresso API. Each client has a contract (an interface), an injection token and an
HTTP implementation. App pages inject the token, so tests and Storybook can supply a fake.

```ts
export interface TilesApi { list(): Observable<Tile[]>; }
export const TILES_API = new InjectionToken<TilesApi>('TILES_API');
export class HttpTilesApi implements TilesApi { ... }
```

Register implementations in the app's `app.config.ts` with `{ provide: TILES_API, useClass: HttpTilesApi }`.
