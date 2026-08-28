import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class DisciplinaService {
  private readonly apiUrl = `${environment.apiUrl}/disciplinas`;
  private readonly http = inject(HttpClient);

  obterDisciplinas(): Observable<DisciplinaInterface[]> {
    return this.http.get<DisciplinaInterface[]>(this.apiUrl);
  }
}
