import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DocenteSqlInterface } from '../../shared/interfaces/docente-sql.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class DocenteService {
  private readonly apiUrl = `${environment.apiUrl}/docentes`;
  private readonly http = inject(HttpClient);

  obterDocentesDisciplinasSql(): Observable<DocenteSqlInterface[]> {
    return this.http.get<DocenteSqlInterface[]>(this.apiUrl, {});
  }
}
