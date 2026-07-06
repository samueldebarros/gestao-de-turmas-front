import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';
import { FeriadoService } from '../services/feriado.service';

@Injectable({ providedIn: 'root' })
export class FeriadoFacadeService {
  private readonly feriadoService = inject(FeriadoService);
  private readonly anoAtual = new Date().getFullYear();

  readonly feriadosAnoAtual$: Observable<string[]> = this.feriadoService
    .obterFeriados(this.anoAtual)
    .pipe(
      map((feriados) => feriados.map((feriado) => feriado.date)),
      catchError(() => of<string[]>([])),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
}
