import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthFacadeService } from '../facades/auth-facade.service';

export const autenticadoGuard: CanMatchFn = () => {
  const auth = inject(AuthFacadeService);
  return auth.estaAutenticado() || inject(Router).createUrlTree(['/login']);
};
