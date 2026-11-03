import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // Never forward identity tokens to third-party URLs.
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  return from(inject(AuthService).accessToken()).pipe(
    switchMap(token => next(token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request))
  );
};
