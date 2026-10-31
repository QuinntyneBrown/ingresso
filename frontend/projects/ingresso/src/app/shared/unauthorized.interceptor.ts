import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from 'api';

/**
 * Sends the visitor to sign in whenever the API says there is no session (L2-033): on first load, or when an
 * existing session ends mid-use. The error still reaches the caller, so stores can clear their state.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof ApiError && error.status === 401 && !router.url.startsWith('/sign-in')) {
        void router.navigateByUrl('/sign-in');
      }
      return throwError(() => error);
    }),
  );
};
