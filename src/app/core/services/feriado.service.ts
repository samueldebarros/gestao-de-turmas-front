import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { delay, Observable, retry, throwError, timeout, TimeoutError, timer } from 'rxjs';
import { environment } from '../../../environments/environments';
import { FeriadoInterface } from '../../shared/interfaces/entities/feriado.interface';

@Injectable({ providedIn: 'root' })
export class FeriadoService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly apiUrl = `${environment.brasilApiUrl}/feriados/v1`;

  private readonly timeoutMs = 5_000;
  private readonly maxTentativas = 2;
  private readonly backoffBaseMs = 500;

  obterFeriados(ano: number): Observable<FeriadoInterface[]> {
    return this.http.get<FeriadoInterface[]>(`${this.apiUrl}/${ano}`).pipe(
      timeout({ each: this.timeoutMs }),
      retry({
        count: this.maxTentativas,
        delay: (erro, tentativa) =>
          this.ehTransitorio(erro) ? timer(tentativa * this.backoffBaseMs) : throwError(() => erro),
      }),
    );
  }

  private ehTransitorio(erro: unknown): boolean {
    if (erro instanceof TimeoutError) return true;
    return erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status >= 500);
  }
}
