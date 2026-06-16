import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { LoginDTO } from '../../shared/interfaces/login-dto.interface';
import { Observable } from 'rxjs';
import { UsuarioAutenticadoInterface } from '../../shared/interfaces/usuario-autenticado.interface';
import { PapelUsuario } from '../../shared/types/papel-usuario.type';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(credenciais: LoginDTO): Observable<UsuarioAutenticadoInterface> {
    return this.http.post<UsuarioAutenticadoInterface>(`${this.apiUrl}/login`, credenciais);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }

  obterUsuarioAtual(): Observable<UsuarioAutenticadoInterface> {
    return this.http.get<UsuarioAutenticadoInterface>(`${this.apiUrl}/me`);
  }
}
