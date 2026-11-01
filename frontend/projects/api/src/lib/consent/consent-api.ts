import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** A scope and what it lets the app do, in plain words (L2-122). */
export interface ConsentScope {
  scope: string;
  title: string;
}

/** What the consent page shows (L2-121, L2-125). */
export interface Consent {
  appName: string;
  /** The signed-in person's email. */
  email: string;
  /** The requested scopes not yet approved. */
  ask: ConsentScope[];
  /** The scopes approved before, for the new-scopes wording. */
  approved: ConsentScope[];
}

/** Reads what an app asks for, and records Allow (ADR 0018). */
export interface ConsentApi {
  get(clientId: string, scope: string): Observable<Consent>;
  /** Records the approval; the anti-forgery header goes with it (L2-127). */
  allow(clientId: string, scope: string): Observable<void>;
}

export const CONSENT_API = new InjectionToken<ConsentApi>('CONSENT_API');

@Injectable()
export class HttpConsentApi implements ConsentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(clientId: string, scope: string): Observable<Consent> {
    const params = new HttpParams().set('client_id', clientId).set('scope', scope);
    return this.http.get<Consent>(`${this.baseUrl}/api/consent`, { params });
  }

  allow(clientId: string, scope: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/consent`, { clientId, scope });
  }
}
