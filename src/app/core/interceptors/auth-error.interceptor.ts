import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../facades/auth-facade.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthFacadeService);
  const ehEndpointdeAuth = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && !ehEndpointdeAuth) {
        return auth.renovarSessao().pipe(
          switchMap(() => next(req)),
          catchError((erroRenovacao) => {
            auth.encerrarSessaoLocal();
            router.navigateByUrl('/login');
            return throwError(() => erroRenovacao);
          }),
        );
      }

      if (erro.status === 403 && !ehEndpointdeAuth) {
        router.navigateByUrl('/sem-permissao');
      }

      return throwError(() => erro);
    }),
  );
};
