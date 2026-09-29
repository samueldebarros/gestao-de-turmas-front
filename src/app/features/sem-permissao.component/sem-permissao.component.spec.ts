import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../core/facades/auth-facade.service';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';
import { SemPermissaoComponent } from './sem-permissao.component';

describe('SemPermissaoComponent', () => {
  let fixture: ComponentFixture<SemPermissaoComponent>;

  const montar = (papel: PapelUsuario | null) => {
    const router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      imports: [SemPermissaoComponent],
      providers: [
        { provide: AuthFacadeService, useValue: { papelAtual: () => papel } },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(SemPermissaoComponent);
    fixture.detectChanges();
    return router;
  };

  it('Admin vai para /turmas', () => {
    const router = montar('Admin');

    fixture.componentInstance.irParaInicio();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/turmas');
  });

  it('Coordenador vai para /turmas', () => {
    const router = montar('Coordenador');

    fixture.componentInstance.irParaInicio();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/turmas');
  });

  it('Docente vai para /alunos', () => {
    const router = montar('Docente');

    fixture.componentInstance.irParaInicio();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/alunos');
  });

  it('sem papel vai para /login', () => {
    const router = montar(null);

    fixture.componentInstance.irParaInicio();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
