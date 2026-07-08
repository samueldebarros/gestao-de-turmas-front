import { inject, Injectable } from '@angular/core';
import { TurmaService } from '../services/turma.service';
import { TurmaFiltro } from '../../shared/interfaces/ui/turma-filtro.interface';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { EstadoLista } from '../../shared/interfaces/ui/estado-lista.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { TurnoEnum } from '../../shared/enums/turno.enum';

@Injectable({
  providedIn: 'root',
})
export class TurmaFacadeService {
  private readonly turmaService = inject(TurmaService);

  private readonly filtroPadrao: TurmaFiltro = {
    pagina: 1,
    tamanhoPagina: 12,
    pesquisa: '',
    anoLetivo: null,
    turno: null,
    ativo: null,
  };

  private readonly _paginaState$ = new BehaviorSubject<TurmaFiltro>({ ...this.filtroPadrao });

  readonly estado$: Observable<EstadoLista<TurmaInterface>> = this._paginaState$.pipe(
    debounceTime(0),
    switchMap((filtro) =>
      this.turmaService.obterTurmas(filtro).pipe(
        map((resultado) => ({ status: 'ok', resultado }) as EstadoLista<TurmaInterface>),
        startWith({ status: 'carregando' } as EstadoLista<TurmaInterface>),
        catchError(() => of({ status: 'erro' } as EstadoLista<TurmaInterface>)),
      ),
    ),
  );

  aplicarFiltros(filtros: FiltroListaInterface): void {
    this._paginaState$.next({
      ...this._paginaState$.value,
      pagina: 1,
      pesquisa: filtros.pesquisa ?? '',
      anoLetivo: (filtros['anoLetivo'] as number | null) ?? null,
      turno: (filtros['turno'] as TurnoEnum | null) ?? null,
      ativo: (filtros['ativo'] as boolean | null) ?? null,
    });
  }

  mudarPagina(pagina: number): void {
    this._paginaState$.next({ ...this._paginaState$.value, pagina });
  }
}
