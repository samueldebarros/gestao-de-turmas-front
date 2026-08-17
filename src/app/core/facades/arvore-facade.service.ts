import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
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

const CARREGANDO: EstadoBuscaFilhos = { status: 'carregando' };
const ERRO: EstadoBuscaFilhos = { status: 'erro' };

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

  readonly filhos$: Observable<IndiceFilhos> = this.indice$.asObservable();

  readonly raiz$: Observable<EstadoBuscaFilhos> = this.turmaService
    .obterTurmas({
      pagina: 1,
      tamanhoPagina: 50,
      pesquisa: '',
      anoLetivo: null,
      turno: null,
      ativo: true,
    })
    .pipe(
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

  carregarDocentesDaTurma(chave: ChaveNo, turmaId: number): void {
    this.pedir({ chave, buscar: () => this.turmaService.obterDocentesDaTurma(turmaId) });
  }

  carregarAlunosDaTurma(chave: ChaveNo, turmaId: number): void {
    this.pedir({ chave, buscar: () => this.turmaService.obterAlunosDaTurma(turmaId) });
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
}
