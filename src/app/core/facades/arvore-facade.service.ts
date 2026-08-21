import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
} from 'rxjs';
import { TurmaService } from '../services/turma.service';
import {
  EntidadeArvore,
  EstadoBuscaFilhos,
  IndiceFilhos,
} from '../../shared/interfaces/ui/arvore-escolar.interface';
import { ChaveNo } from '../../shared/interfaces/ui/no-arvore.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { chaveTurmaDocentes } from '../../shared/utils/chaves-arvore.util';
import { InclusaoTurma, TurmaFiltro } from '../../shared/interfaces/ui/turma-filtro.interface';

const CARREGANDO: EstadoBuscaFilhos = { status: 'carregando' };
const ERRO: EstadoBuscaFilhos = { status: 'erro' };

const FILTRO_BASE: TurmaFiltro = {
  pagina: 1,
  tamanhoPagina: 50,
  pesquisa: '',
  anoLetivo: null,
  turno: null,
  ativo: true,
};

const INCLUSOES: InclusaoTurma[] = ['docentes'];

type EstadoLote = 'ocioso' | 'carregando' | 'pronto' | 'erro';

interface PedidoFilhos {
  chave: ChaveNo;
  buscar: () => Observable<EntidadeArvore[]>;
}

@Injectable({
  providedIn: 'root',
})
export class ArvoreFacadeService {
  private readonly turmaService = inject(TurmaService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly indice$ = new BehaviorSubject<IndiceFilhos>(new Map());
  private readonly expandiu$ = new Subject<PedidoFilhos>();

  private estadoLote: EstadoLote = 'ocioso';

  readonly filhos$: Observable<IndiceFilhos> = this.indice$.asObservable();

  readonly raiz$: Observable<EstadoBuscaFilhos> = this.turmaService.obterTurmas(FILTRO_BASE).pipe(
    map((resultado) => this.pronto(resultado.itens)),
    startWith(CARREGANDO),
    catchError(() => of(ERRO)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    this.expandiu$
      .pipe(
        mergeMap((pedido) =>
          pedido.buscar().pipe(
            map((filhos) => ({ chave: pedido.chave, estado: this.pronto(filhos) })),
            catchError(() => of({ chave: pedido.chave, estado: ERRO })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ chave, estado }) => this.gravar(chave, estado));
  }

  exibirTudo(): void {
    if (this.estadoLote === 'carregando' || this.estadoLote === 'pronto') return;

    this.estadoLote = 'carregando';

    this.turmaService
      .obterTurmas({ ...FILTRO_BASE, incluir: INCLUSOES.join(',') })
      .pipe(
        catchError(() => {
          this.estadoLote = 'erro';
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.absorverExpansao(resultado.itens);
        this.estadoLote = 'pronto';
      });
  }

  carregarDocentesDaTurma(chave: ChaveNo, turmaId: number): void {
    this.pedir({ chave, buscar: () => this.turmaService.obterDocentesDaTurma(turmaId) });
  }

  private pedir(pedido: PedidoFilhos): void {
    const atual = this.indice$.value.get(pedido.chave);
    if (atual?.status === 'pronto' || atual?.status === 'carregando') return;
    this.gravar(pedido.chave, CARREGANDO);
    this.expandiu$.next(pedido);
  }

  private gravar(chave: ChaveNo, estado: EstadoBuscaFilhos): void {
    this.indice$.next(new Map(this.indice$.value).set(chave, estado));
  }

  private pronto(filhos: EntidadeArvore[]): EstadoBuscaFilhos {
    return { status: 'pronto', filhos };
  }

  private absorverExpansao(turmas: TurmaInterface[]): void {
    const lote = new Map<ChaveNo, EstadoBuscaFilhos>();

    for (const turma of turmas) {
      if (turma.docentes != null) {
        lote.set(chaveTurmaDocentes(turma), this.pronto(turma.docentes));
      }
    }

    this.gravarLote(lote);
  }

  private gravarLote(estados: ReadonlyMap<ChaveNo, EstadoBuscaFilhos>): void {
    if (estados.size === 0) return;

    const proximo = new Map(this.indice$.value);
    for (const [chave, estado] of estados) proximo.set(chave, estado);

    this.indice$.next(proximo);
  }
}
