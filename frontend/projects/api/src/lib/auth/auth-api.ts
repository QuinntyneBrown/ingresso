import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** The signed-in user, as the header and greeting show them. */
export interface CurrentUser {
  name: string;
  email: string;
  initials: string;
  /** The workspace the person signed in to, such as "Northwind". */
  workspace: string | null;
  /** How they signed in, such as "SSO". */
  signInMethod: string | null;
}

export interface AuthApi {
  /** The signed-in user; fails with a 401 `ApiError` when anonymous. */
  me(): Observable<CurrentUser>;
  /** Emails a single-use sign-in link. Succeeds the same way whether or not the address has an account. */
  requestSignInLink(email: string): Observable<void>;
  /** Ends this device's session on the server and clears its cookie. */
  signOut(): Observable<void>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/api/auth/me`);
  }

  requestSignInLink(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/sign-in-links`, { email });
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/sign-out`, null);
  }
}
