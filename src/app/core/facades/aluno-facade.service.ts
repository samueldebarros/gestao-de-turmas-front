import { inject, Injectable } from '@angular/core';
import { AlunoService } from '../services/aluno.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthFacadeService } from './auth-facade.service';
import { AlunoAdicionarDTO } from '../../shared/interfaces/dto/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/dto/aluno-editar-dto.interface';
import { ImportacaoResultado } from '../../shared/interfaces/dto/importacao-alunos.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { OrdenacaoTabela } from '../../shared/interfaces/ui/ordenaca-tabela.interface';
import { OrdenacaoAlunoEnum } from '../../shared/enums/ordenacao-aluno.enum';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { CacheMemoria } from '../../shared/utils/cache-memoria';
import { SexoEnum } from '../../shared/enums/sexo.enum';

@Injectable({
  providedIn: 'root',
})
export class AlunoFacadeService {
  private readonly alunoService = inject(AlunoService);
  private readonly filtroPadrao: AlunoFiltro = {
    pagina: 1,
    tamanhoPagina: 10,
    pesquisa: '',
    sexo: null,
    ativo: null,
    ordenacao: null,
    direcao: null,
  };

  private readonly cacheSugestoes = new CacheMemoria<AlunoInterface[]>({
    ttlMs: 5 * 60 * 1000,
    limite: 50,
  });

  private readonly filtros$ = new BehaviorSubject<AlunoFiltro>({ ...this.filtroPadrao });

  readonly resultado$: Observable<ResultadoPaginado<AlunoInterface>> = this.filtros$.pipe(
    debounceTime(0),
    switchMap((filtros) => this.alunoService.obterTodosOsAlunos(filtros)),
  );

  readonly ordenacaoAtual$: Observable<OrdenacaoTabela | null> = this.filtros$.pipe(
    map((filtros) =>
      filtros.ordenacao != null && filtros.direcao != null
        ? { campo: filtros.ordenacao, direcao: filtros.direcao }
        : null,
    ),
    distinctUntilChanged(
      (antes, depois) => antes?.campo === depois?.campo && antes?.direcao === depois?.direcao,
    ),
  );

  constructor() {
    inject(AuthFacadeService)
      .estaLogado$.pipe(
        distinctUntilChanged(),
        filter((logado) => !logado),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.cacheSugestoes.limpar());
  }

  public aplicarFiltros(filtros: FiltroListaInterface): void {
    this.filtros$.next({
      ...this.filtros$.value,
      sexo: (filtros['sexo'] as SexoEnum | null) ?? null,
      ativo: (filtros['ativo'] as boolean | null) ?? null,
      pesquisa: filtros.pesquisa,
      pagina: 1,
    });
  }

  public ordenarPor(campo: OrdenacaoAlunoEnum): void {
    const { ordenacao, direcao } = this.filtros$.value;
    const proximo = this.proximaOrdenacao(campo, ordenacao, direcao);
    this.filtros$.next({
      ...this.filtros$.value,
      ordenacao: proximo.ordenacao,
      direcao: proximo.direcao,
      pagina: 1,
    });
  }

  private proximaOrdenacao(
    campo: OrdenacaoAlunoEnum,
    ordenacaoAtual: OrdenacaoAlunoEnum | null,
    direcaoAtual: DirecaoOrdenacaoEnum | null,
  ): { ordenacao: OrdenacaoAlunoEnum | null; direcao: DirecaoOrdenacaoEnum | null } {
    if (ordenacaoAtual !== campo) return { ordenacao: campo, direcao: DirecaoOrdenacaoEnum.ASC };
    if (direcaoAtual === DirecaoOrdenacaoEnum.ASC)
      return { ordenacao: campo, direcao: DirecaoOrdenacaoEnum.DESC };
    return { ordenacao: null, direcao: null };
  }

  public mudarPagina(pagina: number): void {
    this.filtros$.next({ ...this.filtros$.value, pagina: pagina });
  }

  public adicionar(dto: AlunoAdicionarDTO): Observable<void> {
    return this.alunoService.adicionarAluno(dto).pipe(tap(() => this.aposMutacao()));
  }

  public importarAlunos(dtos: AlunoAdicionarDTO[]): Observable<ImportacaoResultado> {
    return this.alunoService.importarAlunos(dtos).pipe(tap(() => this.aposMutacao()));
  }

  public editar(dto: AlunoEditarDTO): Observable<void> {
    return this.alunoService.editarAluno(dto).pipe(tap(() => this.aposMutacao()));
  }

  public inativar(id: number): Observable<void> {
    return this.alunoService.inativarAluno(id).pipe(tap(() => this.aposMutacao()));
  }

  public reativar(id: number): Observable<void> {
    return this.alunoService.reativarAluno(id).pipe(tap(() => this.aposMutacao()));
  }

  public buscarSugestoes(termo: string): Observable<AlunoInterface[]> {
    const chave = termo.trim().toLowerCase();
    if (!chave) return of([]);

    const emCache = this.cacheSugestoes.get(chave);
    if (emCache) return of(emCache);

    return this.alunoService
      .obterTodosOsAlunos({ ...this.filtroPadrao, tamanhoPagina: 5, pesquisa: chave })
      .pipe(
        map((resultado) => resultado.itens),
        tap((itens) => this.cacheSugestoes.set(chave, itens)),
      );
  }

  private aposMutacao(): void {
    this.cacheSugestoes.limpar();
    this.filtros$.next({ ...this.filtros$.value });
  }
}
