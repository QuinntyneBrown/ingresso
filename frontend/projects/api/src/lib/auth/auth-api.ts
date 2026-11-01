import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** The signed-in user, as the header and greeting show them. */
export interface CurrentUser {
  /** The display name the person saved, or null when they have none; never the email (L2-146, ADR 0024). */
  displayName: string | null;
  email: string;
  initials: string;
  /** The workspace the person signed in to, such as "Northwind". */
  workspace: string | null;
  /** How they signed in, such as "SSO". */
  signInMethod: string | null;
  /** Whether the address has proved inbox control; unverified accounts cannot use tiles (L2-029). */
  emailVerified: boolean;
  /** `admin` for administrators, who manage the apps that sign in with ingresso (L2-103); otherwise `member`. */
  role?: 'admin' | 'member';
}

/** An app the signed-out page signs out: its name and its front-channel sign-out address (journey 18). */
export interface SignedOutApp {
  name: string;
  logoutUri: string;
}

/** What the signed-out page does: the apps to sign out, then where to continue (null: offer Sign in again). */
export interface SignedOut {
  apps: SignedOutApp[];
  returnUrl: string | null;
}

export interface AuthApi {
  /** The signed-in user; fails with a 401 `ApiError` when anonymous. */
  me(): Observable<CurrentUser>;
  /**
   * Emails a single-use sign-in link. Succeeds the same way whether or not the address has an account. Opening the
   * link goes to `returnUrl`, a local path such as an app's authorization request (L2-093), or home.
   */
  requestSignInLink(email: string, returnUrl?: string | null): Observable<void>;
  /** A registered app's name, for the sign-in page; fails with a not-found `ApiError` for an unknown client ID. */
  appName(clientId: string): Observable<string>;
  /** Emails an unverified account another verification link; fails with a rate-limited `ApiError` when asked too often. */
  resendVerification(): Observable<void>;
  /**
   * Ends this device's session on the server and clears its cookie. Emits the signed-out page's ticket when apps
   * signed in under the session must be signed out too (L2-101), otherwise null.
   */
  signOut(): Observable<string | null>;
  /** The apps a signed-out ticket names; fails with a not-found `ApiError` for an unreadable or old ticket. */
  signedOut(ticket: string): Observable<SignedOut>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/api/auth/me`);
  }

  requestSignInLink(email: string, returnUrl?: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/sign-in-links`, {
      email,
      returnUrl: returnUrl ?? null,
    });
  }

  appName(clientId: string): Observable<string> {
    return this.http
      .get<{ name: string }>(`${this.baseUrl}/api/auth/apps/${encodeURIComponent(clientId)}`)
      .pipe(map((app) => app.name));
  }

  resendVerification(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/verification-emails`, null);
  }

  signOut(): Observable<string | null> {
    return this.http
      .post<{ signedOut: string | null } | null>(`${this.baseUrl}/api/auth/sign-out`, null)
      .pipe(map((result) => result?.signedOut ?? null));
  }

  signedOut(ticket: string): Observable<SignedOut> {
    return this.http.get<SignedOut>(`${this.baseUrl}/api/auth/signed-out`, { params: { ticket } });
  }
}
