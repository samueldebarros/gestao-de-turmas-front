import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AlunoInterface } from '../../shared/interfaces/aluno.interface';
import { AlunoCreateDTO } from '../../shared/interfaces/aluno-create-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private readonly apiUrl = 'https://localhost:7048/api/alunos';

  constructor(private readonly http: HttpClient) {}

  buscarAlunos(): Observable<AlunoInterface[]> {
    return this.http.get<AlunoInterface[]>(this.apiUrl);
  }

  adicionarAluno(aluno: AlunoCreateDTO): Observable<any> {
    return this.http.post(this.apiUrl, aluno);
  }
}
