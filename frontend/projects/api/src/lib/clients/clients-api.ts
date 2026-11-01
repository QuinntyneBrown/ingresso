import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** An app registered to sign in with ingresso, as Settings → Apps lists it (L2-104). Never its secret. */
export interface RegisteredApp {
  clientId: string;
  name: string;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  scopes: string[];
  frontChannelLogoutUri: string | null;
  /** True for a server app that authenticates with a secret (L2-106). */
  confidential: boolean;
}

/** What the register-app dialog sends (L2-105). */
export interface AppRegistration {
  name: string;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  frontChannelLogoutUri: string | null;
  scopes: string[];
  confidential: boolean;
}

/** A newly registered app, with its secret when it is confidential; the only time the secret is ever sent (L2-106). */
export interface AppRegistered {
  client: RegisteredApp;
  clientSecret: string | null;
}

/** A registered API and the scopes apps may be allowed (L2-095). */
export interface ApiResource {
  name: string;
  audience: string;
  scopes: string[];
}

/** The apps that sign in with ingresso, for administrators (L2-104 to L2-106). */
export interface ClientsApi {
  /** Every registered app, sorted by name. */
  list(): Observable<RegisteredApp[]>;
  /** Registers an app; fails with a validation `ApiError` (field errors) or a conflict for a name in use. */
  register(registration: AppRegistration): Observable<AppRegistered>;
  /** The registered APIs, whose scopes an app may be allowed. */
  resources(): Observable<ApiResource[]>;
}

export const CLIENTS_API = new InjectionToken<ClientsApi>('CLIENTS_API');

@Injectable()
export class HttpClientsApi implements ClientsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<RegisteredApp[]> {
    return this.http.get<RegisteredApp[]>(`${this.baseUrl}/api/clients`);
  }

  register(registration: AppRegistration): Observable<AppRegistered> {
    return this.http.post<AppRegistered>(`${this.baseUrl}/api/clients`, registration);
  }

  resources(): Observable<ApiResource[]> {
    return this.http.get<ApiResource[]>(`${this.baseUrl}/api/resources`);
  }
}
