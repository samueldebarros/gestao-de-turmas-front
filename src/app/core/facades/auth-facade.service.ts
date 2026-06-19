import { inject, Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { UsuarioAutenticadoInterface } from '../../shared/interfaces/entities/usuario-autenticado.interface';
import { LoginDTO } from '../../shared/interfaces/dto/login-dto.interface';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authService = inject(AuthService);

  private readonly _usuario$ = new BehaviorSubject<UsuarioAutenticadoInterface | null>(null);

  readonly usuarioLogado$ = this._usuario$.asObservable();
  readonly papel$ = this._usuario$.pipe(map((u) => u?.role ?? null));
  readonly estaLogado$ = this._usuario$.pipe(map((u) => u !== null));

  login(credenciais: LoginDTO): Observable<UsuarioAutenticadoInterface> {
    return this.authService.login(credenciais).pipe(tap((u) => this._usuario$.next(u)));
  }

  logout(): Observable<void> {
    return this.authService.logout().pipe(tap((u) => this._usuario$.next(null)));
  }

  restaurarSessao(): Observable<UsuarioAutenticadoInterface | null> {
    return this.authService.obterUsuarioAtual().pipe(
      tap((u) => this._usuario$.next(u)),
      catchError(() => {
        this._usuario$.next(null);
        return of(null);
      }),
    );
  }

  estaAutenticado(): boolean {
    return this._usuario$.value !== null;
  }
  papelAtual(): PapelUsuario | null {
    return this._usuario$.value?.role ?? null;
  }
  encerrarSessaoLocal(): void {
    this._usuario$.next(null);
  }
}
