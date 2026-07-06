import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { FeriadoInterface } from '../../shared/interfaces/entities/feriado.interface';

@Injectable({ providedIn: 'root' })
export class FeriadoService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly apiUrl = `${environment.brasilApiUrl}/feriados/v1`;

  obterFeriados(ano: number): Observable<FeriadoInterface[]> {
    return this.http.get<FeriadoInterface[]>(`${this.apiUrl}/${ano}`);
  }
}
