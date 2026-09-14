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
  tap,
} from 'rxjs';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { EstadoLista } from '../../shared/interfaces/ui/estado-lista.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { TurmaAdicionarDTO } from '../../shared/interfaces/dto/turma-adicionar-dto.interface';
import { TurmaEditarDTO } from '../../shared/interfaces/dto/turma-editar-dto.interface';

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
    switchMap((filtros) =>
      this.turmaService.obterTurmas(filtros).pipe(
        tap((resultado) => this.reconciliarPagina(filtros, resultado)),
        map((resultado) => ({ status: 'ok', resultado: resultado }) as EstadoLista<TurmaInterface>),
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

  adicionar(dto: TurmaAdicionarDTO): Observable<void> {
    return this.turmaService
      .adicionarTurma(dto)
      .pipe(tap(() => this._paginaState$.next({ ...this._paginaState$.value, pagina: 1 })));
  }

  editar(dto: TurmaEditarDTO): Observable<void> {
    return this.turmaService.editarTurma(dto).pipe(tap(() => this.aposMutacao()));
  }

  inativar(id: number): Observable<void> {
    return this.turmaService.inativarTurma(id).pipe(tap(() => this.aposMutacao()));
  }

  reativar(id: number): Observable<void> {
    return this.turmaService.reativarTurma(id).pipe(tap(() => this.aposMutacao()));
  }

  private aposMutacao(): void {
    this._paginaState$.next({ ...this._paginaState$.value });
  }

  private reconciliarPagina(
    filtros: TurmaFiltro,
    resultado: ResultadoPaginado<TurmaInterface>,
  ): void {
    if (resultado.itens.length === 0 && filtros.pagina > 1) {
      this._paginaState$.next({ ...filtros, pagina: 1 });
    }
  }
}
