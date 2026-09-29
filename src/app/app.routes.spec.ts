import { TestBed } from '@angular/core/testing';
import { CanMatchFn, Route } from '@angular/router';
import { routes } from './app.routes';
import { AuthFacadeService } from './core/facades/auth-facade.service';
import { ITENS_MENU, pode } from './core/acesso/acesso.util';
import { PapelUsuario } from './shared/types/papel-usuario.type';

describe('routes — canMatch preso ao menu', () => {
  const papeis: PapelUsuario[] = ['Admin', 'Coordenador', 'Docente'];
  const rotasDeDominio = routes.filter((rota) => rota.loadChildren);

  function itemDoMenu(rota: Route) {
    const item = ITENS_MENU.find((candidato) => candidato.url === `/${rota.path}`);
    if (!item) {
      throw new Error(`nenhum item de ITENS_MENU aponta para /${rota.path}`);
    }
    return item;
  }

  function executarCanMatch(rota: Route, papel: PapelUsuario): boolean {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthFacadeService,
          useValue: { estaAutenticado: () => true, papelAtual: () => papel },
        },
      ],
    });
    const guards = (rota.canMatch ?? []) as CanMatchFn[];
    return guards.every((guard) => TestBed.runInInjectionContext(() => guard(rota, [])) === true);
  }

  for (const rota of rotasDeDominio) {
    describe(`rota /${rota.path}`, () => {
      it.each(papeis)(
        'libera para %s exatamente quando o item de menu correspondente permite',
        (papel) => {
          const item = itemDoMenu(rota);
          const liberou = executarCanMatch(rota, papel);

          expect(liberou).toBe(pode(papel, item.permissao));
        },
      );
    });
  }
});
