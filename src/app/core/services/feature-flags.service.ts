import { HttpBackend, HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { FeatureFlagsInterface } from '../../shared/interfaces/infra/feature-flags.interface';

const CAMINHO_FLAGS = '/flags.json';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly flags = signal<FeatureFlagsInterface>(environment.flags);

  readonly importarCsv: Signal<boolean> = computed(() => this.flags().importarCsv);

  carregar(): Observable<void> {
    return this.http.get<Partial<FeatureFlagsInterface>>(CAMINHO_FLAGS).pipe(
      tap((remotas) => this.flags.set({ ...environment.flags, ...remotas })),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }
}
