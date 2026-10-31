import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AUTH_API, CurrentUser } from 'api';

/** The signed-in person, loaded when the shell starts; an unverified account is sent to verify its email. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly auth = inject(AUTH_API);
  private readonly router = inject(Router);

  readonly user = signal<CurrentUser | null>(null);

  load(): void {
    this.auth.me().subscribe({
      next: (user) => {
        this.user.set(user);
        // An account that has not verified its address cannot use tiles, so it goes to say why (L2-029).
        if (!user.emailVerified && !this.router.url.startsWith('/verify-email')) {
          void this.router.navigate(['/verify-email'], { queryParamsHandling: 'preserve' });
        }
      },
      error: () => this.user.set(null),
    });
  }

  /** Ends the session on the server, then forgets the person. */
  signOut(): Observable<void> {
    return this.auth.signOut().pipe(tap(() => this.user.set(null)));
  }
}
