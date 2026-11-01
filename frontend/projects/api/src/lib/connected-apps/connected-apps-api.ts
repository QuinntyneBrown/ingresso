import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ConsentScope } from '../consent/consent-api';
import { API_BASE_URL } from '../core/api-config';

/** An app the signed-in person approved (L2-128). */
export interface ConnectedApp {
  clientId: string;
  name: string;
  /** What it can do, in plain words, without `openid`. */
  scopes: ConsentScope[];
  approvedAt: string;
  /** When ingresso last issued it a token for the person; null when never (ADR 0019). */
  lastUsedAt: string | null;
}

/** The signed-in person's connected apps (L2-128 to L2-130). */
export interface ConnectedAppsApi {
  list(): Observable<ConnectedApp[]>;
}

export const CONNECTED_APPS_API = new InjectionToken<ConnectedAppsApi>('CONNECTED_APPS_API');

@Injectable()
export class HttpConnectedAppsApi implements ConnectedAppsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<ConnectedApp[]> {
    return this.http.get<ConnectedApp[]>(`${this.baseUrl}/api/connected-apps`);
  }
}
