import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** The signed-in person's profile, for Settings → Profile (L2-117). */
export interface Profile {
  /** Null when not set; the email is used instead. */
  displayName: string | null;
  email: string;
  emailVerified: boolean;
}

/** Reads and changes the signed-in person's own profile (L2-117). */
export interface ProfileApi {
  get(): Observable<Profile>;
  /** Sets the display name, trimmed; empty clears it. Fails with a validation `ApiError` (field errors). */
  update(displayName: string): Observable<Profile>;
}

export const PROFILE_API = new InjectionToken<ProfileApi>('PROFILE_API');

@Injectable()
export class HttpProfileApi implements ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/api/profile`);
  }

  update(displayName: string): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/api/profile`, { displayName });
  }
}
