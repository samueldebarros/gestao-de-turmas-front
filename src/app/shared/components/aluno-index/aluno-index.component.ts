import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TabelaGenerica } from '../tabela-generica/tabela-generica.component.js';
import { TabelaColuna } from '../../interfaces/tabela-coluna.interface.js';
import { Botao } from '../botao/botao.component.js';
import { Modal } from '../modal/modal.component.js';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormFieldTextComponent } from '../form-field-text.component/form-field-text.component.js';
import { CpfCnpjValidator } from '../../validators/cpf-cnpj.validator.js';
import { IdadeValidator } from '../../validators/idade.validator.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SelectOptionInterface } from '../../interfaces/select-option.interface.js';
import { FormFieldSelectComponent } from '../form-field-select.component/form-field-select.component.js';
import { MensagemComponent } from '../mensagem.component/mensagem.component';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service.js';
import { Observable, catchError, of, tap } from 'rxjs';
import { AsyncPipe, DatePipe } from '@angular/common';
import { SexoEnum } from '../../enums/sexo.enum.js';
import { AlunoAdicionarDTO } from '../../interfaces/aluno-adicionar-dto.interface.js';
import { AlunoEditarDTO } from '../../interfaces/aluno-editar-dto.interface.js';
import { AcaoTabela } from '../../interfaces/acao-tabela.interface.js';
import { EventoAcaoTabela } from '../../interfaces/evento-acao-tabela.interface.js';
import { AlunoInterface } from '../../interfaces/aluno.interface.js';
import { formatarCpfCnpj } from '../../utils/cpf-cnpj.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SexoFormatPipe } from '../../pipes/sexo-format.pipe.js';
import { ErrorMessagePipe } from '../../pipes/error-message.pipe';
import { FiltroListaComponent } from '../filtro-lista.component/filtro-lista.component';
import { SelectFilterInterface } from '../../interfaces/select-filter.interface.js';
import { FiltroListaInterface } from '../../interfaces/filtro-lista.interface';
import { AlertaState } from '../../interfaces/alerta-state.interface';
import { PaginacaoComponent } from '../paginacao.component/paginacao.component';
import { ResultadoPaginado } from '../../interfaces/resultado-paginado.interface';

@Component({
  selector: 'app-aluno-index',
  standalone: true,
  imports: [
    TabelaGenerica,
    Botao,
    Modal,
    ReactiveFormsModule,
    FormFieldTextComponent,
    TranslatePipe,
    FormFieldSelectComponent,
    MensagemComponent,
    AsyncPipe,
    ErrorMessagePipe,
    FiltroListaComponent,
    PaginacaoComponent,
  ],
  templateUrl: './aluno-index.component.html',
  styleUrl: './aluno-index.component.scss',
  providers: [DatePipe, SexoFormatPipe],
})
export class AlunoIndex implements OnInit {
  public resultado$!: Observable<ResultadoPaginado<AlunoInterface>>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(AlunoFacadeService);
  private readonly sexoFormatPipe = inject(SexoFormatPipe);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);
  private readonly translate = inject(TranslateService);

  public colunas: TabelaColuna[] = [
    { chave: 'id', titulo: 'TABELA.COLUNAS.ALUNO.CODIGO' },
    { chave: 'matricula', titulo: 'TABELA.COLUNAS.ALUNO.MATRICULA' },
    { chave: 'nome', titulo: 'TABELA.COLUNAS.ALUNO.NOME' },
    {
      chave: 'cpf',
      titulo: 'TABELA.COLUNAS.ALUNO.CPF_CNPJ',
      formatador: (v) => formatarCpfCnpj(v),
      cssClassCelula: () => 'nowrap',
    },
    {
      chave: 'dataNascimento',
      titulo: 'TABELA.COLUNAS.ALUNO.DATA_NASCIMENTO',
      formatador: (v) => this.datePipe.transform(v, 'dd/MM/yyyy') ?? '',
    },
    { chave: 'email', titulo: 'TABELA.COLUNAS.ALUNO.EMAIL' },
    {
      chave: 'sexo',
      titulo: 'TABELA.COLUNAS.ALUNO.SEXO',
      formatador: (v) => this.sexoFormatPipe.transform(v),
      cssClassCelula: () => '',
    },
    {
      chave: 'ativo',
      titulo: 'TABELA.COLUNAS.ALUNO.STATUS',
      cssClassCabecalho: 'coluna-centralizada',
      cssClassCelula: (v) => (v ? 'badge badge-ativo' : 'badge badge-inativo'),
      formatador: (v) => (v ? 'ALUNO.FORMULARIO.STATUS_ATIVO' : 'ALUNO.FORMULARIO.STATUS_INATIVO'),
    },
  ];

  public opcoesSexo: SelectOptionInterface[] = [
    { value: 1, label: 'ALUNO.FORMULARIO.SEXO_MASCULINO' },
    { value: 2, label: 'ALUNO.FORMULARIO.SEXO_FEMININO' },
    { value: 3, label: 'ALUNO.FORMULARIO.SEXO_OUTRO' },
  ];

  public opcoesStatus: SelectOptionInterface[] = [
    { value: true, label: 'ALUNO.FORMULARIO.STATUS_ATIVO' },
    { value: false, label: 'ALUNO.FORMULARIO.STATUS_INATIVO' },
  ];

  public acoesTabela: AcaoTabela[] = [
    { id: 'editar', rotulo: 'ALUNO.BOTOES.EDITAR', varianteBotao: 'primario' },
    {
      id: 'inativar',
      rotulo: 'ALUNO.BOTOES.INATIVAR',
      varianteBotao: 'perigo',
      condicaoVisibilidade: (aluno: AlunoInterface) => aluno.ativo === true,
    },
    {
      id: 'reativar',
      rotulo: 'ALUNO.BOTOES.REATIVAR',
      varianteBotao: 'sucesso',
      condicaoVisibilidade: (aluno: AlunoInterface) => aluno.ativo === false,
    },
  ];

  public filtrosAluno: SelectFilterInterface[] = [
    {
      controlName: 'sexo',
      label: '',
      placeholder: 'TABELA.COLUNAS.ALUNO.SEXO',
      options: this.opcoesSexo,
    },
    {
      controlName: 'ativo',
      label: '',
      placeholder: 'TABELA.COLUNAS.ALUNO.STATUS',
      options: this.opcoesStatus,
    },
  ];

  private modoModal: 'adicionar' | 'editar' = 'adicionar';
  private alunoEmEdicao: AlunoInterface | null = null;

  public isModalAberto: boolean = false;

  public alertaModal: AlertaState = { visivel: false, tipo: 'sucesso', texto: '' };
  public alertaPagina: AlertaState = { visivel: false, tipo: 'erro', texto: '' };

  private exibirAlertaModal(tipo: AlertaState['tipo'], texto: string): void {
    this.alertaModal = { visivel: true, tipo, texto };
  }

  private ocultarAlertaModal(): void {
    this.alertaModal = { ...this.alertaModal, visivel: false };
  }

  public abrirModal() {
    this.isModalAberto = true;
  }

  public fecharModal() {
    this.isModalAberto = false;
    this.ocultarAlertaModal();
    this.modoModal = 'adicionar';
    this.alunoEmEdicao = null;
    this.alunoForm.get('cpf')?.enable();
    this.alunoForm.reset();
  }

  public get tituloModal(): string {
    return this.modoModal === 'editar'
      ? 'ALUNO.MODAL.EDICAO_TITULO'
      : 'ALUNO.MODAL.CADASTRO_TITULO';
  }

  public get rotuloSubmit(): string {
    return this.modoModal === 'editar'
      ? 'ALUNO.BOTOES.SALVAR_ALTERACOES'
      : 'ALUNO.BOTOES.ADICIONAR_ALUNO';
  }

  private exibirAlertaPagina(tipo: AlertaState['tipo'], texto: string): void {
    this.alertaPagina = { visivel: true, tipo, texto };
  }

  public definirAcao(evento: EventoAcaoTabela<AlunoInterface>) {
    switch (evento.acaoId) {
      case 'editar':
        this.alunoEmEdicao = evento.item;
        this.modoModal = 'editar';
        this.abrirModalEdicao(evento.item);
        break;
      case 'inativar':
        this.inativarAluno(evento.item.id);
        break;
      case 'reativar':
        this.reativarAluno(evento.item.id);
        break;
      default:
        console.warn(`Ação não reconhecida: ${evento.acaoId}`);
    }
  }

  public alunoForm!: FormGroup<{
    nome: FormControl<string | null>;
    cpf: FormControl<string | null>;
    email: FormControl<string | null>;
    dataNascimento: FormControl<string | null>;
    sexo: FormControl<number | null>;
  }>;

  public ngOnInit(): void {
    this.alunoForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, CpfCnpjValidator.validarCpfCnpj()]],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', [Validators.required, IdadeValidator.validarIdade()]],
      sexo: new FormControl<number | null>(null, Validators.required),
    });

    this.resultado$ = this.facade.resultado$;

    const valoresNumericosSexoEnum = Object.values(SexoEnum).filter(
      (valor) => typeof valor === 'number',
    ) as number[];

    this.opcoesSexo = valoresNumericosSexoEnum.map((valor) => ({
      value: valor,
      label: this.sexoFormatPipe.transform(valor),
    }));
  }

  private abrirModalEdicao(aluno: AlunoInterface): void {
    this.alunoForm.patchValue({
      nome: aluno.nome,
      email: aluno.email,
      sexo: aluno.sexo,
      cpf: formatarCpfCnpj(aluno.cpf),
      dataNascimento: this.formatarDataParaFormulario(aluno.dataNascimento),
    });
    this.alunoForm.get('cpf')?.disable();
    this.isModalAberto = true;
  }

  private formatarDataParaFormulario(data: Date | string): string {
    return this.datePipe.transform(data, 'yyyy-MM-dd') ?? '';
  }

  public salvarAluno(): void {
    if (this.modoModal === 'editar') this.editarAluno();
    else this.adicionarAluno();
  }

  private criarAlunoParaEnvio(): AlunoAdicionarDTO {
    const formValues = this.alunoForm.value;

    return {
      nome: formValues.nome!.trim(),
      cpf: formValues.cpf!.trim(),
      email: formValues.email!.trim(),
      dataNascimento: this.alunoForm.value.dataNascimento!,
      sexo: Number(formValues.sexo),
    };
  }

  filtrarTabela(filtro: FiltroListaInterface): void {
    this.facade.aplicarFiltros(filtro);
  }

  mudarPagina(pagina: number): void {
    this.facade.mudarPagina(pagina);
  }

  private executarAcaoNaLista(
    acao$: Observable<unknown>,
    chaveSucesso: string,
    chaveErro: string,
    aoSucesso?: () => void,
  ): void {
    acao$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          aoSucesso?.();
          this.exibirAlertaPagina('sucesso', chaveSucesso);
        }),
        catchError(() => {
          this.exibirAlertaPagina('erro', chaveErro);
          return of(null);
        }),
      )
      .subscribe();
  }

  private adicionarAluno() {
    if (this.alunoForm.invalid) {
      this.exibirAlertaModal('erro', 'MENSAGEM.FORMULARIO_INVALIDO');
      return;
    }
    const novoAluno = this.criarAlunoParaEnvio();

    this.executarAcaoNaLista(
      this.facade.adicionar(novoAluno),
      'MENSAGEM.SUCESSO_CADASTRO_ALUNO',
      'MENSAGEM.ERRO_CADASTRO_ALUNO',
      () => this.fecharModal(),
    );
  }

  private editarAluno(): void {
    if (this.alunoForm.invalid) {
      this.exibirAlertaModal('erro', 'MENSAGEM.FORMULARIO_INVALIDO');
      return;
    }
    const payload: AlunoEditarDTO = {
      id: this.alunoEmEdicao!.id,
      nome: this.alunoForm.value.nome!.trim(),
      email: this.alunoForm.value.email!.trim(),
      sexo: Number(this.alunoForm.value.sexo),
      dataNascimento: this.alunoForm.value.dataNascimento!,
    };

    this.executarAcaoNaLista(
      this.facade.editar(payload),
      'MENSAGEM.SUCESSO_EDICAO_ALUNO',
      'MENSAGEM.ERRO_EDICAO_ALUNO',
      () => this.fecharModal(),
    );
  }

  private inativarAluno(id: number) {
    this.executarAcaoNaLista(
      this.facade.inativar(id),
      'MENSAGEM.SUCESSO_INATIVAR_ALUNO',
      'MENSAGEM.ERRO_INATIVAR_ALUNO',
    );
  }

  private reativarAluno(id: number) {
    this.executarAcaoNaLista(
      this.facade.reativar(id),
      'MENSAGEM.SUCESSO_REATIVAR_ALUNO',
      'MENSAGEM.ERRO_REATIVAR_ALUNO',
    );
  }
}
