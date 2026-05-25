import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AlunoInterface } from '../../shared/interfaces/aluno.interface';
import { AlunoAdicionarDTO } from '../../shared/interfaces/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/aluno-editar-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private readonly apiUrl = 'https://localhost:7048/api/alunos';

  constructor(private readonly http: HttpClient) {}

  obterTodosOsAlunos(pagina: number, tamanhoPagina: number = 10): Observable<AlunoInterface[]> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanhoPagina', tamanhoPagina.toString());

    return this.http.get<AlunoInterface[]>(this.apiUrl, { params });
  }

  adicionarAluno(aluno: AlunoAdicionarDTO): Observable<any> {
    return this.http.post(this.apiUrl, aluno);
  }

  inativarAluno(alunoId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${alunoId}/inativar`, {});
  }

  reativarAluno(alunoId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${alunoId}/reativar`, {});
  }

  editarAluno(aluno: AlunoEditarDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${aluno.id}`, aluno);
  }
}
