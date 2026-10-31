import { inject, Injectable, signal } from '@angular/core';
import { AUTH_API, CurrentUser } from 'api';

/** The signed-in person, loaded once when the shell starts. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly auth = inject(AUTH_API);

  readonly user = signal<CurrentUser | null>(null);

  load(): void {
    this.auth.me().subscribe({ next: (user) => this.user.set(user), error: () => this.user.set(null) });
  }
}
