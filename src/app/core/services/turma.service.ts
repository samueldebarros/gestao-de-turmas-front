import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TurmaFiltro } from '../../shared/interfaces/ui/turma-filtro.interface';
import { Observable } from 'rxjs';
import { AlunoDaTurmaInterface } from '../../shared/interfaces/entities/aluno-da-turma.interface';
import { AlunoDisponivelInterface } from '../../shared/interfaces/entities/aluno-disponivel.interface';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { TurmaAdicionarDTO } from '../../shared/interfaces/dto/turma-adicionar-dto.interface';
import { TurmaEditarDTO } from '../../shared/interfaces/dto/turma-editar-dto.interface';
import { MatricularAlunoDTO } from '../../shared/interfaces/dto/matricular-aluno-dto.interface';
import { VincularDocenteDTO } from '../../shared/interfaces/dto/vincular-docente-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class TurmaService {
  private readonly apiUrl = `${environment.apiUrl}/turmas`;
  private readonly http = inject(HttpClient);

  obterTurmas(filtro: TurmaFiltro): Observable<ResultadoPaginado<TurmaInterface>> {
    const params = this.montarParams(filtro);

    return this.http.get<ResultadoPaginado<TurmaInterface>>(this.apiUrl, { params });
  }

  obterDocentesDaTurma(turmaId: number): Observable<DocenteSqlInterface[]> {
    return this.http.get<DocenteSqlInterface[]>(`${this.apiUrl}/${turmaId}/docentes`);
  }

  obterAlunosDaTurma(turmaId: number): Observable<AlunoDaTurmaInterface[]> {
    return this.http.get<AlunoDaTurmaInterface[]>(`${this.apiUrl}/${turmaId}/alunos`);
  }

  obterAlunosDisponiveis(turmaId: number): Observable<AlunoDisponivelInterface[]> {
    return this.http.get<AlunoDisponivelInterface[]>(
      `${this.apiUrl}/${turmaId}/alunos-disponiveis`,
    );
  }

  private montarParams(filtro: TurmaFiltro): HttpParams {
    return Object.entries(filtro)
      .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
      .reduce((params, [chave, valor]) => params.set(chave, String(valor)), new HttpParams());
  }

  adicionarTurma(dto: TurmaAdicionarDTO): Observable<void> {
    return this.http.post<void>(this.apiUrl, dto);
  }

  editarTurma(dto: TurmaEditarDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${dto.id}`, dto);
  }

  inativarTurma(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/inativar`, {});
  }

  reativarTurma(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reativar`, {});
  }

  matricularAluno(turmaId: number, dto: MatricularAlunoDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${turmaId}/alunos`, dto);
  }

  cancelarMatricula(turmaId: number, alunoId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${turmaId}/alunos/${alunoId}/cancelar`, {});
  }

  vincularDocente(turmaId: number, dto: VincularDocenteDTO): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${turmaId}/docentes`, dto);
  }

  desvincularDisciplina(turmaId: number, disciplinaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${turmaId}/disciplinas/${disciplinaId}`);
  }
}
