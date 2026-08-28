import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { DisciplinaFacadeService } from '../../core/facades/disciplina-facade.service';
import { DocenteFacadeService } from '../../core/facades/docente-facade.service';
import { Botao } from '../../shared/components/botao/botao.component';
import { DatePickerComponent } from '../../shared/components/date-picker.component/date-picker.component';
import { FiltroListaComponent } from '../../shared/components/filtro-lista.component/filtro-lista.component';
import { FormFieldSelectComponent } from '../../shared/components/form-field-select.component/form-field-select.component';
import { FormFieldTextComponent } from '../../shared/components/form-field-text.component/form-field-text.component';
import { MensagemComponent } from '../../shared/components/mensagem.component/mensagem.component';
import { Modal } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao.component/paginacao.component';
import { TabelaGenerica } from '../../shared/components/tabela-generica/tabela-generica.component';
import { OrdenacaoDocenteEnum } from '../../shared/enums/ordenacao-docente.enum';
import { DocenteAdicionarDTO } from '../../shared/interfaces/dto/docente-adicionar-dto.interface';
import { DocenteEditarDTO } from '../../shared/interfaces/dto/docente-editar-dto.interface';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { AcaoTabela } from '../../shared/interfaces/ui/acao-tabela.interface';
import { AlertaState } from '../../shared/interfaces/ui/alerta-state.interface';
import { DetalheAlerta } from '../../shared/interfaces/ui/detalhe-alerta.interface';
import { EstadoModalDocente } from '../../shared/interfaces/ui/estado-modal-docente.interface';
import { EventoAcaoTabela } from '../../shared/interfaces/ui/evento-acao-tabela.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { SelectFilterInterface } from '../../shared/interfaces/ui/select-filter.interface';
import { SelectOptionInterface } from '../../shared/interfaces/ui/select-option.interface';
import { TabelaColuna } from '../../shared/interfaces/ui/tabela-coluna.interface';
import { extrairMensagemDeRegra } from '../../shared/utils/mensagem-regra-negocio.util';
import { ErrorMessagePipe } from '../../shared/pipes/error-message.pipe';
import { CpfCnpjValidator } from '../../shared/validators/cpf-cnpj.validator';
import { IdadeValidator } from '../../shared/validators/idade.validator';

const SEM_DISCIPLINA = 0;

const ROTULO_DO_CAMPO: Record<string, string> = {
  nome: 'DOCENTE.FORMULARIO.NOME_LABEL',
  cpf: 'DOCENTE.FORMULARIO.CPF_LABEL',
  email: 'DOCENTE.FORMULARIO.EMAIL_LABEL',
  dataNascimento: 'DOCENTE.FORMULARIO.DATA_NASCIMENTO_LABEL',
  disciplinaId: 'DOCENTE.FORMULARIO.DISCIPLINA_LABEL',
};

@Component({
  selector: 'app-docente-index',
  imports: [
    TabelaGenerica,
    FiltroListaComponent,
    PaginacaoComponent,
    MensagemComponent,
    Modal,
    Botao,
    ReactiveFormsModule,
    FormFieldTextComponent,
    FormFieldSelectComponent,
    DatePickerComponent,
    AsyncPipe,
    TranslatePipe,
    ErrorMessagePipe,
  ],
  templateUrl: './docente-index.component.html',
  styleUrl: './docente-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocenteIndexComponent {
  private readonly docentesFacade = inject(DocenteFacadeService);
  private readonly disciplinaFacade = inject(DisciplinaFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly erroMessagePipe = new ErrorMessagePipe();

  public readonly resultado$ = this.docentesFacade.resultado$;
  public readonly ordenacaoAtual$ = this.docentesFacade.ordenacaoAtual$;

  public readonly alertaPagina = signal<AlertaState>({
    visivel: false,
    tipo: 'erro',
    texto: '',
  });

  public readonly alertaModal = signal<AlertaState>({
    visivel: false,
    tipo: 'erro',
    texto: '',
  });

  private readonly estadoModal = signal<EstadoModalDocente>({ modo: 'fechado' });

  public readonly modoModal = computed(() => this.estadoModal().modo);
  public readonly modalAberto = computed(() => this.estadoModal().modo !== 'fechado');

  public readonly tituloModal = computed(() =>
    this.estadoModal().modo === 'editar'
      ? 'DOCENTE.MODAL.EDICAO_TITULO'
      : 'DOCENTE.MODAL.CADASTRO_TITULO',
  );

  public readonly rotuloSubmit = computed(() =>
    this.estadoModal().modo === 'editar'
      ? 'DOCENTE.BOTOES.SALVAR_ALTERACOES'
      : 'DOCENTE.BOTOES.ADICIONAR_DOCENTE',
  );

  private readonly disciplinas = toSignal(
    this.disciplinaFacade.disciplinas$.pipe(
      catchError(() => {
        this.exibirAlertaPagina('erro', 'MENSAGEM.ERRO_CARREGAR_DISCIPLINAS');
        return of([] as DisciplinaInterface[]);
      }),
    ),
    { initialValue: [] as DisciplinaInterface[] },
  );

  public readonly opcoesDisciplina = computed<SelectOptionInterface[]>(() => {
    const estado = this.estadoModal();
    const vinculoAtual = estado.modo === 'editar' ? estado.docente.disciplinaId : null;

    const disponiveis = this.disciplinas().filter(
      (disciplina) => disciplina.ativo || disciplina.id === vinculoAtual,
    );

    return [
      { value: SEM_DISCIPLINA, label: 'DOCENTE.FORMULARIO.DISCIPLINA_NENHUMA' },
      ...disponiveis.map((disciplina) => ({ value: disciplina.id, label: disciplina.nome })),
    ];
  });

  public readonly docenteForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, CpfCnpjValidator.validarCpfCnpj()]],
    email: ['', [Validators.email]],
    dataNascimento: ['', [Validators.required, IdadeValidator.validarIdade()]],
    disciplinaId: [SEM_DISCIPLINA as number | null],
  });

  public colunas: TabelaColuna[] = [
    { chave: 'id', titulo: 'TABELA.COLUNAS.DOCENTE.CODIGO' },
    {
      chave: 'nome',
      titulo: 'TABELA.COLUNAS.DOCENTE.NOME',
      chaveOrdenacao: OrdenacaoDocenteEnum.NOME,
    },
    { chave: 'email', titulo: 'TABELA.COLUNAS.DOCENTE.EMAIL' },
    {
      chave: 'disciplinaNome',
      titulo: 'TABELA.COLUNAS.DOCENTE.DISCIPLINA',
      chaveOrdenacao: OrdenacaoDocenteEnum.DISCIPLINA,
      formatador: (valor: string | null) => valor ?? 'DOCENTE.SEM_DISCIPLINA',
    },
    {
      chave: 'ativo',
      titulo: 'TABELA.COLUNAS.DOCENTE.STATUS',
      formatador: (valor: boolean) => (valor ? 'DOCENTE.STATUS_ATIVO' : 'DOCENTE.STATUS_INATIVO'),
    },
  ];

  public opcoesStatus: SelectOptionInterface[] = [
    { value: true, label: 'DOCENTE.STATUS_ATIVO' },
    { value: false, label: 'DOCENTE.STATUS_INATIVO' },
  ];

  public filtrosDocente: SelectFilterInterface[] = [
    {
      controlName: 'ativo',
      label: '',
      placeholder: 'TABELA.COLUNAS.DOCENTE.STATUS',
      options: this.opcoesStatus,
    },
  ];

  public acoesTabela: AcaoTabela[] = [
    {
      id: 'editar',
      rotulo: 'DOCENTE.BOTOES.EDITAR',
      varianteBotao: 'primario',
      condicaoVisibilidade: (docente: DocenteListaInterface) => docente.ativo === true,
    },
    {
      id: 'inativar',
      rotulo: 'DOCENTE.BOTOES.INATIVAR',
      varianteBotao: 'perigo',
      condicaoVisibilidade: (docente: DocenteListaInterface) => docente.ativo === true,
    },
    {
      id: 'reativar',
      rotulo: 'DOCENTE.BOTOES.REATIVAR',
      varianteBotao: 'sucesso',
      condicaoVisibilidade: (docente: DocenteListaInterface) => docente.ativo === false,
    },
  ];

  public filtrarTabela(filtro: FiltroListaInterface): void {
    this.docentesFacade.aplicarFiltros(filtro);
  }

  public mudarPagina(pagina: number): void {
    this.docentesFacade.mudarPagina(pagina);
  }

  public ordenar(campo: OrdenacaoDocenteEnum): void {
    this.docentesFacade.ordenarPor(campo);
  }

  public definirAcao(evento: EventoAcaoTabela<DocenteListaInterface>): void {
    switch (evento.acaoId) {
      case 'editar':
        this.carregarParaEdicao(evento.item.id);
        break;
      case 'inativar':
        this.executarAcaoNaLista(
          this.docentesFacade.inativar(evento.item.id),
          'MENSAGEM.SUCESSO_INATIVAR_DOCENTE',
          'MENSAGEM.ERRO_INATIVAR_DOCENTE',
        );
        break;
      case 'reativar':
        this.executarAcaoNaLista(
          this.docentesFacade.reativar(evento.item.id),
          'MENSAGEM.SUCESSO_REATIVAR_DOCENTE',
          'MENSAGEM.ERRO_REATIVAR_DOCENTE',
        );
        break;
    }
  }

  public abrirModalAdicionar(): void {
    this.ocultarAlertaModal();
    this.limparFormulario();
    this.docenteForm.controls.cpf.enable();
    this.estadoModal.set({ modo: 'adicionar' });
  }

  public fecharModal(): void {
    this.ocultarAlertaModal();
    this.limparFormulario();
    this.docenteForm.controls.cpf.enable();
    this.estadoModal.set({ modo: 'fechado' });
  }

  public salvarDocente(): void {
    this.ocultarAlertaModal();

    const estado = this.estadoModal();
    if (estado.modo === 'editar') this.editarDocente(estado.docente);
    else if (estado.modo === 'adicionar') this.adicionarDocente();
  }

  private textoDoErro(erro: unknown, chaveErro: string): string {
    const status = (erro as { status?: number } | null)?.status;
    if (status !== 422) return chaveErro;

    return extrairMensagemDeRegra(erro) ?? 'MENSAGEM.ERRO_REGRA_NEGOCIO_DOCENTE';
  }

  public ocultarAlertaPagina(): void {
    this.alertaPagina.update((alerta) => ({ ...alerta, visivel: false }));
  }

  public ocultarAlertaModal(): void {
    this.alertaModal.update((alerta) => ({ ...alerta, visivel: false }));
  }

  private carregarParaEdicao(id: number): void {
    this.docentesFacade
      .carregarDetalhe(id)
      .pipe(
        tap((docente) => this.abrirModalEdicao(docente)),
        catchError(() => {
          this.exibirAlertaPagina('erro', 'MENSAGEM.ERRO_CARREGAR_DOCENTE');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private abrirModalEdicao(docente: DocenteDetalheInterface): void {
    this.ocultarAlertaModal();
    this.docenteForm.reset({
      nome: docente.nome,
      cpf: '',
      email: docente.email ?? '',
      dataNascimento: docente.dataNascimento,
      disciplinaId: docente.disciplinaId ?? SEM_DISCIPLINA,
    });
    this.docenteForm.controls.cpf.disable();
    this.estadoModal.set({ modo: 'editar', docente });
  }

  private adicionarDocente(): void {
    if (this.docenteForm.invalid) {
      this.recusarFormularioInvalido();
      return;
    }

    const valores = this.docenteForm.getRawValue();
    const novo: DocenteAdicionarDTO = {
      nome: valores.nome!.trim(),
      cpf: valores.cpf!.trim(),
      email: this.textoOuNulo(valores.email),
      dataNascimento: valores.dataNascimento!,
      disciplinaId: this.disciplinaOuNula(valores.disciplinaId),
    };

    this.executarAcaoNoModal(
      this.docentesFacade.adicionar(novo),
      'MENSAGEM.SUCESSO_CADASTRO_DOCENTE',
      'MENSAGEM.ERRO_CADASTRO_DOCENTE',
    );
  }

  private editarDocente(docente: DocenteDetalheInterface): void {
    if (this.docenteForm.invalid) {
      this.recusarFormularioInvalido();
      return;
    }

    const valores = this.docenteForm.getRawValue();
    const alteracao: DocenteEditarDTO = {
      id: docente.id,
      nome: valores.nome!.trim(),
      email: this.textoOuNulo(valores.email),
      dataNascimento: valores.dataNascimento!,
      disciplinaId: this.disciplinaOuNula(valores.disciplinaId),
    };

    this.executarAcaoNoModal(
      this.docentesFacade.editar(alteracao),
      'MENSAGEM.SUCESSO_EDICAO_DOCENTE',
      'MENSAGEM.ERRO_EDICAO_DOCENTE',
    );
  }

  private disciplinaOuNula(valor: number | null | undefined): number | null {
    return valor == null || Number(valor) === SEM_DISCIPLINA ? null : Number(valor);
  }

  private textoOuNulo(valor: string | null | undefined): string | null {
    const limpo = valor?.trim() ?? '';
    return limpo === '' ? null : limpo;
  }

  private limparFormulario(): void {
    this.docenteForm.reset({
      nome: '',
      cpf: '',
      email: '',
      dataNascimento: '',
      disciplinaId: SEM_DISCIPLINA,
    });
  }

  private executarAcaoNaLista(
    acao$: Observable<unknown>,
    chaveSucesso: string,
    chaveErro: string,
  ): void {
    acao$
      .pipe(
        tap(() => this.exibirAlertaPagina('sucesso', chaveSucesso)),
        catchError(() => {
          this.exibirAlertaPagina('erro', chaveErro);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private executarAcaoNoModal(
    acao$: Observable<unknown>,
    chaveSucesso: string,
    chaveErro: string,
  ): void {
    acao$
      .pipe(
        tap(() => {
          this.exibirAlertaPagina('sucesso', chaveSucesso);
          this.fecharModal();
        }),
        catchError((erro: unknown) => {
          this.exibirAlertaModal('erro', this.textoDoErro(erro, chaveErro));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private exibirAlertaPagina(tipo: AlertaState['tipo'], texto: string): void {
    this.alertaPagina.set({ visivel: true, tipo, texto });
  }

  private exibirAlertaModal(
    tipo: AlertaState['tipo'],
    texto: string,
    detalhes: DetalheAlerta[] = [],
  ): void {
    this.alertaModal.set({ visivel: true, tipo, texto, detalhes });
  }

  public causasDeInvalidez(): DetalheAlerta[] {
    return Object.entries(this.docenteForm.controls)
      .filter(([, controle]) => controle.enabled && controle.invalid)
      .map(([nome, controle]) => ({
        campo: ROTULO_DO_CAMPO[nome] ?? nome,
        erro: this.erroMessagePipe.transform(controle),
      }))
      .filter((detalhe) => detalhe.erro !== '');
  }

  private recusarFormularioInvalido(): void {
    this.docenteForm.markAllAsTouched();
    this.exibirAlertaModal('erro', 'MENSAGEM.CORRIJA_OS_CAMPOS', this.causasDeInvalidez());
  }
}
