import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AutocompleteComponent } from '../../../shared/components/autocomplete.component/autocomplete.component';
import { ConfirmacaoComponent } from '../../../shared/components/confirmacao.component/confirmacao.component';
import { FormFieldSelectComponent } from '../../../shared/components/form-field-select.component/form-field-select.component';
import { MensagemComponent } from '../../../shared/components/mensagem.component/mensagem.component';
import { TabelaGenerica } from '../../../shared/components/tabela-generica/tabela-generica.component';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { SituacaoEnturmamentoEnum } from '../../../shared/enums/situacao-enturmamento.enum';
import { AlunoDaTurmaInterface } from '../../../shared/interfaces/entities/aluno-da-turma.interface';
import { AlunoDisponivelInterface } from '../../../shared/interfaces/entities/aluno-disponivel.interface';
import { DocenteSqlInterface } from '../../../shared/interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../../../shared/interfaces/entities/turma.interface';
import { AcaoTabela } from '../../../shared/interfaces/ui/acao-tabela.interface';
import { AlertaState } from '../../../shared/interfaces/ui/alerta-state.interface';
import { ConfirmacaoAcao } from '../../../shared/interfaces/ui/confirmacao-acao.interface';
import { EstadoCarga } from '../../../shared/interfaces/ui/estado-carga.interface';
import { EventoAcaoTabela } from '../../../shared/interfaces/ui/evento-acao-tabela.interface';
import { SelectOptionInterface } from '../../../shared/interfaces/ui/select-option.interface';
import { TabelaColuna } from '../../../shared/interfaces/ui/tabela-coluna.interface';
import { agruparPorDisciplina } from '../../../shared/utils/agrupar-por-disciplina.util';
import { alertaDeErroHttp } from '../../../shared/utils/tratar-erro-http.util';

type AcaoPendenteTurma =
  | { tipo: 'nenhuma' }
  | { tipo: 'desligar'; aluno: AlunoDaTurmaInterface }
  | { tipo: 'desalocar'; docente: DocenteSqlInterface }
  | { tipo: 'alocar'; docenteId: number; confirmacao: ConfirmacaoAcao };

@Component({
  selector: 'app-turma-detalhe',
  imports: [
    TabelaGenerica,
    AutocompleteComponent,
    ConfirmacaoComponent,
    FormFieldSelectComponent,
    MensagemComponent,
    ReactiveFormsModule,
    AsyncPipe,
    TranslatePipe,
  ],
  templateUrl: './turma-detalhe.component.html',
  styleUrl: './turma-detalhe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaDetalheComponent implements OnInit {
  @Input({ required: true }) turma!: TurmaInterface;

  private readonly facade = inject(TurmaFacadeService);
  private readonly docenteFacade = inject(DocenteFacadeService);
  private readonly destroyRef = inject(DestroyRef);

  protected alunos$!: Observable<EstadoCarga<AlunoDaTurmaInterface>>;
  protected docentes$!: Observable<EstadoCarga<DocenteSqlInterface>>;

  private disponiveis$!: Observable<AlunoDisponivelInterface[]>;

  protected readonly opcoesDocente$: Observable<EstadoCarga<SelectOptionInterface>> =
    this.docenteFacade.docentes$.pipe(
      map(
        (estado): EstadoCarga<SelectOptionInterface> =>
          estado.status === 'ok'
            ? {
                status: 'ok',
                itens: agruparPorDisciplina(estado.itens).flatMap((grupo) =>
                  grupo.docentes.map((docente) => ({
                    value: docente.id,
                    label: `${grupo.disciplinaNome} - ${docente.docenteNome}`,
                  })),
                ),
              }
            : estado,
      ),
    );

  readonly alertaPainel = signal<AlertaState>({ visivel: false, tipo: 'erro', texto: '' });

  protected readonly docenteSelecionado = new FormControl<number | null>(null);

  private readonly docentesDisponiveis = toSignal(this.docenteFacade.docentes$, {
    initialValue: { status: 'carregando' } as EstadoCarga<DocenteSqlInterface>,
  });

  private readonly docentesDaTurmaAtual = signal<EstadoCarga<DocenteSqlInterface>>({
    status: 'carregando',
  });

  protected acoesAlunoVisiveis: AcaoTabela[] = [];
  protected acoesDocenteVisiveis: AcaoTabela[] = [];

  private readonly acaoPendente = signal<AcaoPendenteTurma>({ tipo: 'nenhuma' });
  private readonly alunosEmVoo = signal<ReadonlySet<number>>(new Set());
  private readonly docentesEmVoo = signal<ReadonlySet<number>>(new Set());

  protected readonly confirmacaoPendente = computed<ConfirmacaoAcao | null>(() => {
    const pendente = this.acaoPendente();
    switch (pendente.tipo) {
      case 'desligar':
        return this.confirmacaoDesligar(pendente.aluno);
      case 'desalocar':
        return this.confirmacaoDesalocar(pendente.docente);
      case 'alocar':
        return pendente.confirmacao;
      case 'nenhuma':
        return null;
    }
  });

  ngOnInit(): void {
    this.alunos$ = this.facade.alunosDaTurma(this.turma.id);
    this.docentes$ = this.facade
      .docentesDaTurma(this.turma.id)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.docentes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((estado) => this.docentesDaTurmaAtual.set(estado));

    this.disponiveis$ = this.facade
      .alunosDisponiveis(this.turma.id)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.docenteSelecionado.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((docenteId) => this.prepararAlocacaoDocente(docenteId));

    if (this.turma.ativo) {
      this.acoesAlunoVisiveis = this.acoesAluno;
      this.acoesDocenteVisiveis = this.acoesDocente;
    }
  }

  protected readonly buscarAluno = (termo: string): Observable<AlunoDisponivelInterface[]> =>
    this.disponiveis$.pipe(
      map((lista) =>
        lista.filter(
          (aluno) =>
            aluno.nome.toLowerCase().includes(termo.toLowerCase()) ||
            aluno.matricula.includes(termo),
        ),
      ),
    );

  protected readonly rotuloAluno = (aluno: AlunoDisponivelInterface): string =>
    `${aluno.matricula} - ${aluno.nome}`;

  protected readonly colunasAluno: TabelaColuna[] = [
    { chave: 'matricula', titulo: 'TABELA.COLUNAS.ALUNO.MATRICULA' },
    { chave: 'nome', titulo: 'TABELA.COLUNAS.ALUNO.NOME' },
    {
      chave: 'situacao',
      titulo: 'TABELA.COLUNAS.ENTURMAMENTO.SITUACAO',
      formatador: (valor: SituacaoEnturmamentoEnum) => `TURMA.SITUACAO.${valor}`,
    },
    {
      chave: 'dataEnturmamento',
      titulo: 'TABELA.COLUNAS.ENTURMAMENTO.DATA',
      formatador: (valor: string) => new Date(valor).toLocaleDateString('pt-BR'),
    },
  ];

  protected readonly colunasDocente: TabelaColuna[] = [
    { chave: 'docenteNome', titulo: 'TABELA.COLUNAS.DOCENTE.NOME' },
    { chave: 'disciplinaNome', titulo: 'TABELA.COLUNAS.DOCENTE.DISCIPLINA' },
    { chave: 'cargaHoraria', titulo: 'TABELA.COLUNAS.DOCENTE.CARGA_HORARIA' },
  ];

  private readonly acoesAluno: AcaoTabela[] = [
    {
      id: 'desligar',
      rotulo: 'TURMA.BOTOES.CANCELAR_MATRICULA',
      varianteBotao: 'perigo',
      condicaoVisibilidade: (aluno: AlunoDaTurmaInterface) =>
        aluno.situacao === SituacaoEnturmamentoEnum.ATIVO,
      confirmacao: (aluno: AlunoDaTurmaInterface) => this.confirmacaoDesligar(aluno),
      desabilitada: (aluno: AlunoDaTurmaInterface) => this.alunosEmVoo().has(aluno.id),
    },
  ];

  private readonly acoesDocente: AcaoTabela[] = [
    {
      id: 'desalocar',
      rotulo: 'TURMA.BOTOES.DESALOCAR',
      varianteBotao: 'perigo',
      confirmacao: (docente: DocenteSqlInterface) => this.confirmacaoDesalocar(docente),
      desabilitada: (docente: DocenteSqlInterface) =>
        this.docentesEmVoo().has(docente.disciplinaId),
    },
  ];

  protected vagasOcupadas(alunos: AlunoDaTurmaInterface[]): number {
    return alunos.filter((aluno) => aluno.situacao === SituacaoEnturmamentoEnum.ATIVO).length;
  }

  protected matricular(aluno: AlunoDisponivelInterface): void {
    this.executar(
      this.facade.matricularAluno(this.turma.id, { alunoId: aluno.id }),
      'MENSAGEM.SUCESSO_MATRICULA',
      'MENSAGEM.ERRO_MATRICULA',
    );
  }

  protected acaoDaLinha(evento: EventoAcaoTabela<AlunoDaTurmaInterface>): void {
    if (evento.acaoId !== 'desligar') return;

    this.acaoPendente.set({ tipo: 'desligar', aluno: evento.item });
  }

  private prepararAlocacaoDocente(docenteId: number | null): void {
    this.docenteSelecionado.reset(null, { emitEvent: false });
    if (docenteId === null) return;

    const disponiveis = this.docentesDisponiveis();
    const docenteEscolhido =
      disponiveis.status === 'ok'
        ? disponiveis.itens.find((docente) => docente.id === docenteId)
        : undefined;
    if (!docenteEscolhido) return;

    const alocados = this.docentesDaTurmaAtual();
    const docenteAtual =
      alocados.status === 'ok'
        ? alocados.itens.find((docente) => docente.disciplinaId === docenteEscolhido.disciplinaId)
        : undefined;

    if (docenteAtual?.id === docenteEscolhido.id) {
      this.exibirAlerta('sucesso', 'TURMA.MENSAGEM.DOCENTE_JA_ALOCADO', {
        disciplina: docenteEscolhido.disciplinaNome,
      });
      return;
    }

    const confirmacao = docenteAtual
      ? this.confirmacaoTrocarDocente(docenteAtual, docenteEscolhido)
      : this.confirmacaoAlocar(docenteEscolhido);

    this.acaoPendente.set({ tipo: 'alocar', docenteId, confirmacao });
  }

  protected acaoDocente(evento: EventoAcaoTabela<DocenteSqlInterface>): void {
    if (evento.acaoId !== 'desalocar') return;

    this.acaoPendente.set({ tipo: 'desalocar', docente: evento.item });
  }

  protected confirmar(): void {
    const pendente = this.acaoPendente();
    this.acaoPendente.set({ tipo: 'nenhuma' });

    switch (pendente.tipo) {
      case 'desligar': {
        const alunoId = pendente.aluno.id;
        if (this.alunosEmVoo().has(alunoId)) return;

        this.marcarAlunoEmVoo(alunoId, true);
        const aoTerminar = finalize<void>(() => this.marcarAlunoEmVoo(alunoId, false));
        this.executar(
          this.facade.cancelarMatricula(this.turma.id, alunoId).pipe(aoTerminar),
          'MENSAGEM.SUCESSO_CANCELAR_MATRICULA',
          'MENSAGEM.ERRO_CANCELAR_MATRICULA',
        );
        return;
      }
      case 'desalocar': {
        const disciplinaId = pendente.docente.disciplinaId;
        if (this.docentesEmVoo().has(disciplinaId)) return;

        this.marcarDocenteEmVoo(disciplinaId, true);
        const aoTerminar = finalize<void>(() => this.marcarDocenteEmVoo(disciplinaId, false));
        this.executar(
          this.facade.desvincularDisciplina(this.turma.id, disciplinaId).pipe(aoTerminar),
          'MENSAGEM.SUCESSO_DESALOCACAO',
          'MENSAGEM.ERRO_DESALOCACAO',
        );
        return;
      }
      case 'alocar':
        this.executar(
          this.facade.vincularDocente(this.turma.id, { docenteId: pendente.docenteId }),
          'MENSAGEM.SUCESSO_ALOCACAO',
          'MENSAGEM.ERRO_ALOCACAO',
        );
        return;
      case 'nenhuma':
        return;
    }
  }

  protected cancelarAcaoPendente(): void {
    this.acaoPendente.set({ tipo: 'nenhuma' });
  }

  protected ocultarAlerta(): void {
    this.alertaPainel.update((alerta) => ({ ...alerta, visivel: false }));
  }

  private confirmacaoDesligar(aluno: AlunoDaTurmaInterface): ConfirmacaoAcao {
    return {
      titulo: 'CONFIRMACAO.TITULO',
      mensagem: 'TURMA.CONFIRMACAO.DESLIGAR',
      params: { nome: aluno.nome },
      rotuloConfirmar: 'CONFIRMACAO.CONFIRMAR',
      variante: 'perigo',
    };
  }

  private confirmacaoDesalocar(docente: DocenteSqlInterface): ConfirmacaoAcao {
    return {
      titulo: 'CONFIRMACAO.TITULO',
      mensagem: 'TURMA.CONFIRMACAO.DESALOCAR',
      params: { nome: docente.docenteNome, disciplina: docente.disciplinaNome },
      rotuloConfirmar: 'CONFIRMACAO.CONFIRMAR',
      variante: 'perigo',
    };
  }

  private confirmacaoAlocar(docente: DocenteSqlInterface): ConfirmacaoAcao {
    return {
      titulo: 'CONFIRMACAO.TITULO',
      mensagem: 'TURMA.CONFIRMACAO.ALOCAR',
      params: { nome: docente.docenteNome, disciplina: docente.disciplinaNome },
      rotuloConfirmar: 'CONFIRMACAO.CONFIRMAR',
      variante: 'primario',
    };
  }

  private confirmacaoTrocarDocente(
    atual: DocenteSqlInterface,
    escolhido: DocenteSqlInterface,
  ): ConfirmacaoAcao {
    return {
      titulo: 'CONFIRMACAO.TITULO',
      mensagem: 'TURMA.CONFIRMACAO.TROCAR_DOCENTE',
      params: {
        atual: atual.docenteNome,
        nome: escolhido.docenteNome,
        disciplina: escolhido.disciplinaNome,
      },
      rotuloConfirmar: 'CONFIRMACAO.CONFIRMAR',
      variante: 'perigo',
    };
  }

  private executar(acao$: Observable<void>, chaveSucesso: string, chaveErro: string): void {
    acao$
      .pipe(
        tap(() => this.exibirAlerta('sucesso', chaveSucesso)),
        catchError((erro: unknown) => {
          this.alertaPainel.set(
            alertaDeErroHttp(erro, chaveErro, 'MENSAGEM.ERRO_REGRA_NEGOCIO_MATRICULA'),
          );
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private exibirAlerta(
    tipo: AlertaState['tipo'],
    texto: string,
    params?: Record<string, unknown>,
  ): void {
    this.alertaPainel.set({ visivel: true, tipo, texto, params });
  }

  private marcarAlunoEmVoo(id: number, emVoo: boolean): void {
    this.alunosEmVoo.update((atual) => {
      const novo = new Set(atual);
      if (emVoo) {
        novo.add(id);
      } else {
        novo.delete(id);
      }
      return novo;
    });
  }

  private marcarDocenteEmVoo(disciplinaId: number, emVoo: boolean): void {
    this.docentesEmVoo.update((atual) => {
      const novo = new Set(atual);
      if (emVoo) {
        novo.add(disciplinaId);
      } else {
        novo.delete(disciplinaId);
      }
      return novo;
    });
  }
}
