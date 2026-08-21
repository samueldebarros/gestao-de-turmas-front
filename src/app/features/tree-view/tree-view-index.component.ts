import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ArvoreFacadeService } from '../../core/facades/arvore-facade.service';
import { LocalidadeFacadeService } from '../../core/facades/localidade-facade.service';
import { ArvoreComponent } from '../../shared/components/arvore/arvore.component';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { LocalidadeInterface } from '../../shared/interfaces/entities/localidade.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import {
  EntidadeArvore,
  EstadoBuscaFilhos,
  IndiceFilhos,
} from '../../shared/interfaces/ui/arvore-escolar.interface';
import {
  ChaveNo,
  EstadoBusca,
  Indice,
  ModoSelecao,
  NoArvore,
} from '../../shared/interfaces/ui/no-arvore.interface';
import { chaveDocente, chaveTurmaDocentes } from '../../shared/utils/chaves-arvore.util';
import { eDocente, eTurma } from '../../shared/utils/entidade-arvore.util';
import { montarArvoreLocalidades } from '../../shared/utils/montar-arvore-localidades.util';
import { traduzirFilhos } from '../../shared/utils/traduzir-filhos.util';
import { ControleArvore } from './controle-arvore';
import { ControleMarcacao } from './controle-marcacao';
import { ControleSelecao } from './controle-selecao';

const CARREGANDO: EstadoBuscaFilhos = { status: 'carregando' };
const CARREGANDO_LOCAIS: EstadoBusca<LocalidadeInterface> = { status: 'carregando' };
const SEM_TRADUCAO: Record<string, string> = {};

@Component({
  selector: 'app-tree-view-index',
  imports: [ArvoreComponent, TranslatePipe],
  templateUrl: './tree-view-index.component.html',
  styleUrl: './tree-view-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewIndex {
  private readonly turmasFacade = inject(ArvoreFacadeService);
  private readonly localidadesFacade = inject(LocalidadeFacadeService);
  private readonly translate = inject(TranslateService);

  private readonly raizTurmas = toSignal(this.turmasFacade.raiz$, { initialValue: CARREGANDO });
  private readonly indiceTurmas = toSignal(this.turmasFacade.filhos$, {
    initialValue: new Map() as IndiceFilhos,
  });

  private readonly raizLocais = toSignal(this.localidadesFacade.raiz$, {
    initialValue: CARREGANDO_LOCAIS,
  });
  private readonly indiceLocais = toSignal(this.localidadesFacade.filhos$, {
    initialValue: new Map() as Indice<LocalidadeInterface>,
  });

  private readonly serieRotulos: Signal<Record<string, string>> = toSignal(
    this.translate.stream('TURMA.SERIE'),
    { initialValue: SEM_TRADUCAO },
  );

  protected readonly selecionado = signal<string | null>(null);

  protected readonly statusRaizTurmas = computed(() => this.raizTurmas().status);
  protected readonly statusRaizLocais = computed(() => this.raizLocais().status);

  protected readonly modoSelecao = signal<ModoSelecao>('simples');

  protected readonly selecaoTurmas = new ControleSelecao();
  protected readonly selecaoLocais = new ControleSelecao();

  protected readonly marcacaoTurmas = new ControleMarcacao();
  protected readonly marcacaoLocais = new ControleMarcacao();

  protected readonly controleTurmas = new ControleArvore<EntidadeArvore>(
    (no) => this.pedirDocentes(no),
    (no, alternar) => {
      this.selecaoTurmas.selecionar(no.chave, alternar, this.modoSelecao());
      this.selecionado.set(no.rotulo);
    },
  );

  protected readonly controleLocais = new ControleArvore<LocalidadeInterface>(
    (no) => this.localidadesFacade.carregarFilhos(no.chave, no.entidade),
    (no, alternar) => {
      this.selecaoLocais.selecionar(no.chave, alternar, this.modoSelecao());
      this.selecionado.set(no.rotulo);
    },
  );

  protected readonly arvoreTurmas = computed<NoArvore<EntidadeArvore>[]>(() => {
    const raiz = this.raizTurmas();
    if (raiz.status !== 'pronto') return [];

    const indice = this.indiceTurmas();
    return raiz.filhos.filter(eTurma).map((turma) => this.noTurma(turma, indice));
  });

  protected readonly arvoreLocais = computed<NoArvore<LocalidadeInterface>[]>(() => {
    const raiz = this.raizLocais();
    if (raiz.status !== 'pronto') return [];

    return montarArvoreLocalidades(raiz.filhos, this.indiceLocais());
  });

  protected alternarModo(): void {
    this.modoSelecao.set(this.modoSelecao() === 'multipla' ? 'simples' : 'multipla');
    this.selecaoTurmas.limpar();
    this.selecaoLocais.limpar();
  }

  protected exibirTudo<T>(controle: ControleArvore<T>, nos: readonly NoArvore<T>[]): void {
    this.turmasFacade.exibirTudo();
    controle.expandirTudo(nos);
  }

  private noTurma(turma: TurmaInterface, indice: IndiceFilhos): NoArvore<EntidadeArvore> {
    const chave = chaveTurmaDocentes(turma);

    return {
      chave,
      rotulo: this.rotuloTurma(turma),
      entidade: turma,
      filhos: traduzirFilhos(indice.get(chave), (filhos) =>
        filhos.filter(eDocente).map((docente) => this.noDocente(chave, docente)),
      ),
    };
  }

  private noDocente(chaveTurma: ChaveNo, docente: DocenteSqlInterface): NoArvore<EntidadeArvore> {
    return {
      chave: chaveDocente(chaveTurma, docente),
      rotulo: `${docente.docenteNome} · ${docente.disciplinaNome}`,
      entidade: docente,
      filhos: { status: 'folha' },
    };
  }

  private rotuloTurma(turma: TurmaInterface): string {
    const serie = this.rotuloSerie(turma.serie);
    const ocupacao = `${turma.totalAlunos}/${turma.capacidade}`;

    return `${serie} ${turma.identificador} · ${turma.anoLetivo} · ${ocupacao}`;
  }

  private rotuloSerie(serie: number): string {
    return this.serieRotulos()[serie] ?? String(serie);
  }

  private pedirDocentes(no: NoArvore<EntidadeArvore>): void {
    if (eTurma(no.entidade)) this.turmasFacade.carregarDocentesDaTurma(no.chave, no.entidade.id);
  }
}
