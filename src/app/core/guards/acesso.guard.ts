import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthFacadeService } from '../facades/auth-facade.service';
import { pode } from '../acesso/acesso.util';
import { Permissao } from '../acesso/permissao.type';

export const acessoGuard =
  (permissao: Permissao): CanMatchFn =>
  () => {
    const auth = inject(AuthFacadeService);
    return pode(auth.papelAtual(), permissao) || inject(Router).createUrlTree(['/sem-permissao']);
  };
