import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AlunoInterface } from '../../shared/interfaces/aluno.interface';
import { AlunoAdicionarDTO } from '../../shared/interfaces/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/aluno-editar-dto.interface';
import { AlunoFiltro } from '../../shared/interfaces/aluno-filtro.interface';
import { ResultadoPaginado } from '../../shared/interfaces/resultado-paginado.interface';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private readonly apiUrl = `${environment.apiUrl}/alunos`;
  private readonly http = inject(HttpClient);

  obterTodosOsAlunos(filtro: AlunoFiltro): Observable<ResultadoPaginado<AlunoInterface>> {
    const params = this.montarParams(filtro);

    return this.http.get<ResultadoPaginado<AlunoInterface>>(this.apiUrl, { params });
  }

  private montarParams(filtro: AlunoFiltro): HttpParams {
    return Object.entries(filtro)
      .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
      .reduce((params, [chave, valor]) => params.set(chave, String(valor)), new HttpParams());
  }

  adicionarAluno(aluno: AlunoAdicionarDTO): Observable<void> {
    return this.http.post<void>(this.apiUrl, aluno);
  }

  inativarAluno(alunoId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${alunoId}/inativar`, {});
  }

  reativarAluno(alunoId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${alunoId}/reativar`, {});
  }

  editarAluno(aluno: AlunoEditarDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${aluno.id}`, aluno);
  }
}
