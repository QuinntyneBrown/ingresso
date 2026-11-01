import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-config';

/** The filters on the Activity page (L2-144). */
export type ActivityCategory = 'sign-ins' | 'app-access' | 'sessions' | 'apps-and-keys';

/** One security event (L2-141 to L2-143). */
export interface ActivityEvent {
  id: number;
  /** Kebab-case, such as `signed-in-to-app` or `app-access-revoked`. */
  type: string;
  category: ActivityCategory;
  /** An app's name or a device description, such as "Chrome on macOS"; empty when there is none. */
  subject: string;
  /** The administrator who made an app or key change; null from the CLI or the schedule. */
  actor: string | null;
  occurredAt: string;
}

/** A page of events, newest first; `next` asks for the older ones, or is null. */
export interface ActivityPage {
  events: ActivityEvent[];
  next: number | null;
}

/** The signed-in person's security events (L2-142 to L2-144). */
export interface ActivityApi {
  list(category: ActivityCategory | null, before: number | null): Observable<ActivityPage>;
}

export const ACTIVITY_API = new InjectionToken<ActivityApi>('ACTIVITY_API');

@Injectable()
export class HttpActivityApi implements ActivityApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(category: ActivityCategory | null, before: number | null): Observable<ActivityPage> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (before !== null) params = params.set('before', before);
    return this.http.get<ActivityPage>(`${this.baseUrl}/api/activity`, { params });
  }
}
