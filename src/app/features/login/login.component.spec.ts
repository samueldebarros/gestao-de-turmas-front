import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthFacadeService } from '../../core/facades/auth-facade.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  const montar = () => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthFacadeService, useValue: { login: vi.fn() } },
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

  const mensagemDoCampoEmail = (): string | null => {
    const campo = fixture.nativeElement.querySelector(
      'app-form-field-text[formControlName="email"] .error-message',
    );
    return campo ? (campo.textContent as string).trim() : null;
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
});
