import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthFacadeService } from '../../core/facades/auth-facade.service';
import { Router } from '@angular/router';
import { AlertaState } from '../../shared/interfaces/ui/alerta-state.interface';
import { LoginDTO } from '../../shared/interfaces/dto/login-dto.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFieldTextComponent } from '../../shared/components/form-field-text.component/form-field-text.component';
import { Botao } from '../../shared/components/botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormFieldTextComponent, Botao, TranslatePipe, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly alerta = signal<AlertaState | null>(null);

  protected readonly loginForm: FormGroup<{
    email: FormControl<string | null>;
    senha: FormControl<string | null>;
  }> = this.fb.group({
    email: this.fb.control<string | null>('', [Validators.required, Validators.email]),
    senha: this.fb.control<string | null>('', [Validators.required]),
  });

  entrar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.alerta.set(null);

    const { email, senha } = this.loginForm.getRawValue();
    const credenciais: LoginDTO = { email: (email ?? '').trim(), senha: senha ?? '' };

    this.authFacade
      .login(credenciais)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/alunos']),
        error: () =>
          this.alerta.set({ visivel: true, tipo: 'erro', texto: 'LOGIN.ERRO_CREDENCIAIS' }),
      });
  }
}
