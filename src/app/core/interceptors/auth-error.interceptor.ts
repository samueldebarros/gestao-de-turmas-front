import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../facades/auth-facade.service';
import { catchError, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthFacadeService);
  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && !req.url.includes('/auth/')) {
        auth.encerrarSessaoLocal();
        router.navigateByUrl('/login');
      }
      if (erro.status === 403 && !req.url.includes('/auth/')) {
        router.navigateByUrl('/sem-permissao');
      }
      return throwError(() => erro);
    }),
  );
};
