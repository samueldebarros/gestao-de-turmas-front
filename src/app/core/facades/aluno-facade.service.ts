import { inject, Injectable } from '@angular/core';
import { AlunoService } from '../services/aluno.service';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AlunoAdicionarDTO } from '../../shared/interfaces/dto/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/dto/aluno-editar-dto.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { SexoEnum } from '../../shared/enums/sexo.enum';
import { OrdenacaoTabela } from '../../shared/interfaces/ui/ordenaca-tabela.interface';
import { OrdenacaoAlunoEnum } from '../../shared/enums/ordenacao-aluno.enum';
import { DirecaoOrdenacaoEnum } from '../../shared/enums/direcao-ordenacao.enum';
import { CacheStorage } from '../../shared/utils/cache-storage';

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
  private readonly _paginaState$ = new BehaviorSubject<AlunoFiltro>({ ...this.filtroPadrao });

  private readonly cacheSugestoes = new CacheStorage<AlunoInterface[]>({
    storage: sessionStorage,
    namespace: 'alunos:sugestoes',
    versao: 1,
    ttlMs: 5 * 60 * 1000,
    limite: 50,
  });

  readonly resultado$: Observable<ResultadoPaginado<AlunoInterface>> = this._paginaState$.pipe(
    debounceTime(0),
    switchMap((filtro) => this.alunoService.obterTodosOsAlunos(filtro)),
  );

  readonly ordenacaoAtual$: Observable<OrdenacaoTabela | null> = this._paginaState$.pipe(
    map((s) =>
      s.ordenacao != null && s.direcao != null ? { campo: s.ordenacao, direcao: s.direcao } : null,
    ),
    distinctUntilChanged((a, b) => a?.campo === b?.campo && a?.direcao === b?.direcao),
  );

  public aplicarFiltros(filtros: FiltroListaInterface): void {
    this._paginaState$.next({
      ...this._paginaState$.value,
      pagina: 1,
      pesquisa: filtros.pesquisa ?? '',
      sexo: (filtros['sexo'] as SexoEnum | null) ?? null,
      ativo: (filtros['ativo'] as boolean | null) ?? null,
    });
  }

  public ordenarPor(campo: OrdenacaoAlunoEnum): void {
    const { ordenacao, direcao } = this._paginaState$.value;
    const proximo = this.proximaOrdenacao(campo, ordenacao, direcao);
    this._paginaState$.next({
      ...this._paginaState$.value,
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
    this._paginaState$.next({
      ...this._paginaState$.value,
      pagina,
    });
  }

  public adicionar(dto: AlunoAdicionarDTO): Observable<void> {
    return this.alunoService.adicionarAluno(dto).pipe(tap(() => this.aposMutacao()));
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
    this._paginaState$.next({ ...this._paginaState$.value });
  }
}
