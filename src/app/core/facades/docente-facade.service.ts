import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { OrdenacaoDocenteEnum } from '../../shared/enums/ordenacao-docente.enum';
import { DocenteAdicionarDTO } from '../../shared/interfaces/dto/docente-adicionar-dto.interface';
import { DocenteEditarDTO } from '../../shared/interfaces/dto/docente-editar-dto.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { DocenteFiltro } from '../../shared/interfaces/ui/docente-filtro.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { OrdenacaoTabela } from '../../shared/interfaces/ui/ordenaca-tabela.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { DocenteService } from '../services/docente.service';

@Injectable({
  providedIn: 'root',
})
export class DocenteFacadeService {
  private readonly docenteService = inject(DocenteService);

  private readonly filtroPadrao: DocenteFiltro = {
    pagina: 1,
    tamanhoPagina: 10,
    pesquisa: '',
    ativo: null,
    ordenacao: null,
    direcao: null,
  };

  public readonly docentes$ = this.docenteService
    .obterDocentesDisciplinasSql()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly filtros$ = new BehaviorSubject<DocenteFiltro>({ ...this.filtroPadrao });

  public readonly resultado$: Observable<ResultadoPaginado<DocenteListaInterface>> =
    this.filtros$.pipe(
      debounceTime(0),
      switchMap((filtro) => this.docenteService.buscarDocentes(filtro)),
    );

  public readonly ordenacaoAtual$: Observable<OrdenacaoTabela | null> = this.filtros$.pipe(
    map((filtro) =>
      filtro.ordenacao != null && filtro.direcao != null
        ? { campo: filtro.ordenacao, direcao: filtro.direcao }
        : null,
    ),
    distinctUntilChanged(
      (antes, depois) => antes?.campo === depois?.campo && antes?.direcao === depois?.direcao,
    ),
  );

  public aplicarFiltros(filtros: FiltroListaInterface): void {
    this.filtros$.next({
      ...this.filtros$.value,
      pesquisa: filtros.pesquisa,
      ativo: (filtros['ativo'] as boolean | null) ?? null,
      pagina: 1,
    });
  }

  public mudarPagina(pagina: number): void {
    this.filtros$.next({ ...this.filtros$.value, pagina });
  }

  public ordenarPor(campo: OrdenacaoDocenteEnum): void {
    const { ordenacao, direcao } = this.filtros$.value;
    const proximo = this.proximaOrdenacao(campo, ordenacao, direcao);
    this.filtros$.next({ ...this.filtros$.value, ...proximo, pagina: 1 });
  }

  public carregarDetalhe(id: number): Observable<DocenteDetalheInterface> {
    return this.docenteService.obterDocentePorId(id);
  }

  public adicionar(dto: DocenteAdicionarDTO): Observable<void> {
    return this.docenteService.adicionarDocente(dto).pipe(tap(() => this.aposMutacao()));
  }

  public editar(dto: DocenteEditarDTO): Observable<void> {
    return this.docenteService.editarDocente(dto).pipe(tap(() => this.aposMutacao()));
  }

  public inativar(id: number): Observable<void> {
    return this.docenteService.inativarDocente(id).pipe(tap(() => this.aposMutacao()));
  }

  public reativar(id: number): Observable<void> {
    return this.docenteService.reativarDocente(id).pipe(tap(() => this.aposMutacao()));
  }

  private proximaOrdenacao(
    campo: OrdenacaoDocenteEnum,
    ordenacaoAtual: OrdenacaoDocenteEnum | null,
    direcaoAtual: DirecaoOrdenacaoEnum | null,
  ): { ordenacao: OrdenacaoDocenteEnum | null; direcao: DirecaoOrdenacaoEnum | null } {
    if (ordenacaoAtual !== campo) return { ordenacao: campo, direcao: DirecaoOrdenacaoEnum.ASC };
    if (direcaoAtual === DirecaoOrdenacaoEnum.ASC)
      return { ordenacao: campo, direcao: DirecaoOrdenacaoEnum.DESC };
    return { ordenacao: null, direcao: null };
  }

  private aposMutacao(): void {
    this.filtros$.next({ ...this.filtros$.value });
  }
}
