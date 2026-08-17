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
import { ArvoreComponent } from '../../shared/components/arvore/arvore.component';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import {
  EntidadeArvore,
  EstadoBuscaFilhos,
  IndiceFilhos,
  NoAgrupamento,
} from '../../shared/interfaces/ui/arvore-escolar.interface';
import { ChaveNo, NoArvore } from '../../shared/interfaces/ui/no-arvore.interface';
import { CpfCnpjPipe } from '../../shared/pipes/cpf-cnpj.pipe';
import { eAluno, eDocente, eTurma } from '../../shared/utils/entidade-arvore.util';
import { montarArvoreTurmas } from '../../shared/utils/montar-arvore-turmas.util';
import { traduzirFilhos } from '../../shared/utils/traduzir-filhos.util';
import { ControleArvore } from './controle-arvore';
import { cpfCnpjMascaradoPipe } from '../../shared/pipes/cpf-cnpj-mascarado.pipe';

const CARREGANDO: EstadoBuscaFilhos = { status: 'carregando' };
const SEM_TRADUCAO: Record<string, string> = {};

interface NoSelecionado {
  rotulo: string;
  aluno: AlunoInterface | null;
}

@Component({
  selector: 'app-tree-view-index',
  imports: [ArvoreComponent, TranslatePipe, CpfCnpjPipe, cpfCnpjMascaradoPipe],
  templateUrl: './tree-view-index.component.html',
  styleUrl: './tree-view-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewIndex {
  private readonly facade = inject(ArvoreFacadeService);
  private readonly translate = inject(TranslateService);

  private readonly raiz = toSignal(this.facade.raiz$, { initialValue: CARREGANDO });
  private readonly indice = toSignal(this.facade.filhos$, {
    initialValue: new Map() as IndiceFilhos,
  });
  private readonly serieRotulos: Signal<Record<string, string>> = toSignal(
    this.translate.stream('TURMA.SERIE'),
    { initialValue: SEM_TRADUCAO },
  );

  protected readonly selecionado = signal<NoSelecionado | null>(null);

  protected readonly statusRaiz = computed(() => this.raiz().status);

  protected readonly controle1 = new ControleArvore<EntidadeArvore>(
    (no) => this.pedirDocentes(no),
    (no) => this.mostrar(no),
  );

  protected readonly controle2 = new ControleArvore<NoAgrupamento>(
    (no) => this.pedirAlunos(no),
    (no) => this.mostrar(no),
  );

  protected readonly arvore1 = computed<NoArvore<EntidadeArvore>[]>(() => {
    const raiz = this.raiz();
    if (raiz.status !== 'pronto') return [];

    const indice = this.indice();
    return raiz.filhos.filter(eTurma).map((turma) => this.noTurma(turma, indice));
  });

  protected readonly arvore2 = computed<NoArvore<NoAgrupamento>[]>(() => {
    const raiz = this.raiz();
    if (raiz.status !== 'pronto') return [];

    return montarArvoreTurmas(raiz.filhos.filter(eTurma), this.indice(), (serie) =>
      this.rotuloSerie(serie),
    );
  });

  private noTurma(turma: TurmaInterface, indice: IndiceFilhos): NoArvore<EntidadeArvore> {
    const chave = `/turma:${turma.id}`;

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
      chave: `${chaveTurma}/docente:${docente.id}/disciplina:${docente.disciplinaNome}`,
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
    if (eTurma(no.entidade)) this.facade.carregarDocentesDaTurma(no.chave, no.entidade.id);
  }

  private pedirAlunos(no: NoArvore<NoAgrupamento>): void {
    if (eTurma(no.entidade)) this.facade.carregarAlunosDaTurma(no.chave, no.entidade.id);
  }

  private mostrar(no: NoArvore<EntidadeArvore> | NoArvore<NoAgrupamento>): void {
    this.selecionado.set({
      rotulo: no.rotulo,
      aluno: eAluno(no.entidade) ? no.entidade : null,
    });
  }
}
