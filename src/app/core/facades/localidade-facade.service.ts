import { DestroyRef, inject, Injectable } from '@angular/core';
import { LocalidadeInterface } from '../../shared/interfaces/entities/localidade.interface';
import { ChaveNo, EstadoBusca, Indice } from '../../shared/interfaces/ui/no-arvore.interface';
import { LocalidadeService } from '../services/localidade.service';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type EstadoLocalidades = EstadoBusca<LocalidadeInterface>;

const CARREGANDO: EstadoLocalidades = { status: 'carregando' };
const ERRO: EstadoLocalidades = { status: 'erro' };

@Injectable({
  providedIn: 'root',
})
export class LocalidadeFacadeService {
  private readonly service = inject(LocalidadeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly indice$ = new BehaviorSubject<Indice<LocalidadeInterface>>(new Map());

  readonly filhos$: Observable<Indice<LocalidadeInterface>> = this.indice$.asObservable();

  readonly raiz$: Observable<EstadoLocalidades> = this.service.obterRegioes().pipe(
    map((regioes) => this.pronto(regioes)),
    startWith(CARREGANDO),
    catchError(() => of(ERRO)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  carregarFilhos(chave: ChaveNo, local: LocalidadeInterface): void {
    const atual = this.indice$.value.get(chave);
    if (atual?.status === 'pronto' || atual?.status === 'carregando') return;

    this.gravar(chave, CARREGANDO);

    this.buscarFilhos(local)
      .pipe(
        catchError(() => {
          this.gravar(chave, ERRO);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filhos) => this.gravar(chave, this.pronto(filhos)));
  }

  private buscarFilhos(local: LocalidadeInterface): Observable<LocalidadeInterface[]> {
    switch (local.nivel) {
      case 'regiao':
        return this.service.obterEstados(local.id);
      case 'uf':
        return this.service.obterMunicipios(local.id);
      case 'municipio':
        return this.service.obterDistritos(local.id);
      default:
        return of([]);
    }
  }

  private gravar(chave: ChaveNo, estado: EstadoLocalidades): void {
    this.indice$.next(new Map(this.indice$.value).set(chave, estado));
  }

  private pronto(filhos: LocalidadeInterface[]): EstadoLocalidades {
    return { status: 'pronto', filhos };
  }
}
