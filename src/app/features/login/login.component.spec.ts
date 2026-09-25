import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AuthFacadeService } from '../../core/facades/auth-facade.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  const montar = (authFacade: { login: ReturnType<typeof vi.fn> } = { login: vi.fn() }) => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  };

  const inputEmail = (): HTMLInputElement =>
    fixture.nativeElement.querySelector(
      'app-form-field-text[formControlName="email"] input',
    ) as HTMLInputElement;

  const inputSenha = (): HTMLInputElement =>
    fixture.nativeElement.querySelector(
      'app-form-field-text[formControlName="senha"] input',
    ) as HTMLInputElement;

  const mensagemDoCampoEmail = (): string | null => {
    const campo = fixture.nativeElement.querySelector(
      'app-form-field-text[formControlName="email"] .error-message',
    );
    return campo ? (campo.textContent as string).trim() : null;
  };

  const preencherCredenciais = () => {
    inputEmail().value = 'ana.souza@escola.com';
    inputEmail().dispatchEvent(new Event('input'));
    inputSenha().value = '123456';
    inputSenha().dispatchEvent(new Event('input'));
  };

  const textoDoAlerta = (): string | null => {
    const alerta = fixture.nativeElement.querySelector('[role="alert"]');
    return alerta ? (alerta.textContent as string).trim() : null;
  };

  it('e-mail vazio e tocado mostra VALIDACAO.OBRIGATORIO, não LOGIN.EMAIL_INVALIDO', () => {
    montar();

    inputEmail().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(mensagemDoCampoEmail()).toBe('VALIDACAO.OBRIGATORIO');
  });

  it('e-mail preenchido sem formato válido e tocado mostra VALIDACAO.EMAIL_INVALIDO', () => {
    montar();

    inputEmail().value = 'xx';
    inputEmail().dispatchEvent(new Event('input'));
    inputEmail().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(mensagemDoCampoEmail()).toBe('VALIDACAO.EMAIL_INVALIDO');
  });

  it('401 do servidor mostra a chave fixa de credenciais, traduzida', () => {
    montar({
      login: vi.fn(() => throwError(() => ({ status: 401 }))),
    });

    preencherCredenciais();
    fixture.componentInstance.entrar();
    fixture.detectChanges();

    expect(textoDoAlerta()).toBe('LOGIN.ERRO_CREDENCIAIS');
  });

  it('erro sem 422 mantém a frase genérica de credenciais, mesmo em 500', () => {
    montar({
      login: vi.fn(() => throwError(() => ({ status: 500 }))),
    });

    preencherCredenciais();
    fixture.componentInstance.entrar();
    fixture.detectChanges();

    expect(textoDoAlerta()).toBe('LOGIN.ERRO_CREDENCIAIS');
  });
});
