import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** One of the signed-in person's devices: an active session (L2-132). */
export interface Device {
  id: string;
  /** "Chrome on macOS" (ADR 0020). */
  device: string;
  signedInAt: string;
  lastActiveAt: string;
  /** The device this request comes from. */
  current: boolean;
}

/** The signed-in person's sessions (L2-132 to L2-134). */
export interface SessionsApi {
  list(): Observable<Device[]>;
  /** Ends the session on another of the person's devices (L2-133). */
  end(id: string): Observable<void>;
}

export const SESSIONS_API = new InjectionToken<SessionsApi>('SESSIONS_API');

@Injectable()
export class HttpSessionsApi implements SessionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/api/sessions`);
  }

  end(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/sessions/${encodeURIComponent(id)}`);
  }
}
