import { CanMatchFn, Router } from '@angular/router';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';
import { inject } from '@angular/core';
import { AuthFacadeService } from '../facades/auth-facade.service';

export const papelGuard =
  (...papeis: PapelUsuario[]): CanMatchFn =>
  () => {
    const auth = inject(AuthFacadeService);
    const ok = auth.estaAutenticado() && papeis.includes(auth.papelAtual()!);
    return ok || inject(Router).createUrlTree(['/sem-permissao']);
  };
