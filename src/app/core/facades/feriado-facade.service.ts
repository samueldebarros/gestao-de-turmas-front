import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { FeriadoService } from '../services/feriado.service';
import { CacheStorage } from '../../shared/utils/cache-storage';

@Injectable({ providedIn: 'root' })
export class FeriadoFacadeService {
  private readonly feriadoService = inject(FeriadoService);
  private readonly anoAtual = new Date().getFullYear();

  private readonly cache = new CacheStorage<string[]>({
    storage: localStorage,
    namespace: 'feriados:nacionais',
    versao: 1,
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    limite: 5,
  });

  readonly feriadosAnoAtual$: Observable<string[]> = this.feriadoService
    .obterFeriados(this.anoAtual)
    .pipe(
      map((feriados) => feriados.map((feriado) => feriado.date)),
      tap((datas) => this.cache.set(String(this.anoAtual), datas)),
      catchError((erro) => {
        console.error(
          `[Feriados] Falha ao carregar feriados de ${this.anoAtual}; usando cache.`,
          erro,
        );
        return of(this.cache.get(String(this.anoAtual)) ?? []);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
}
