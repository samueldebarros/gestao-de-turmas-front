import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { acessoGuard } from './acesso.guard';
import { AuthFacadeService } from '../facades/auth-facade.service';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';

describe('acessoGuard', () => {
  function configurar(papel: PapelUsuario | null): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthFacadeService, useValue: { papelAtual: () => papel } },
      ],
    });
  }

  it('permite a navegação quando o papel pode a permissão', () => {
    configurar('Docente');

    const resultado = TestBed.runInInjectionContext(() => acessoGuard('alunos.acessar')(null!, []));

    expect(resultado).toBe(true);
  });

  it('devolve a UrlTree de /sem-permissao quando o papel não pode a permissão', () => {
    configurar('Docente');

    const resultado = TestBed.runInInjectionContext(() =>
      acessoGuard('docentes.acessar')(null!, []),
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/sem-permissao');
  });

  it('devolve a UrlTree de /sem-permissao quando não há papel', () => {
    configurar(null);

    const resultado = TestBed.runInInjectionContext(() => acessoGuard('turmas.acessar')(null!, []));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/sem-permissao');
  });
});
