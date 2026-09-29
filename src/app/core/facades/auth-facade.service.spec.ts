import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuarioAutenticadoInterface } from '../../shared/interfaces/entities/usuario-autenticado.interface';
import { AuthService } from '../services/auth.service';
import { AuthFacadeService } from './auth-facade.service';

describe('AuthFacadeService — papel como signal', () => {
  let facade: AuthFacadeService;

  const usuarioDocente: UsuarioAutenticadoInterface = { role: 'Docente' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { login: vi.fn(() => of(usuarioDocente)) } }],
    });
    facade = TestBed.inject(AuthFacadeService);
  });

  it('começa nulo, segue o login e volta a nulo ao encerrar a sessão local', () => {
    expect(facade.papel()).toBeNull();

    facade.login({ email: 'ana.souza@escola.com', senha: '123456' }).subscribe();

    expect(facade.papel()).toBe('Docente');

    facade.encerrarSessaoLocal();

    expect(facade.papel()).toBeNull();
  });
});
