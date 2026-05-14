import { Component, OnInit } from '@angular/core';
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
import { AlunoService } from '../../../core/services/aluno.service.js';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AlunoModel } from '../../models/aluno.model.js';
import { SexoEnum } from '../../enums/sexo.enum.js';
import { AlunoCreateDTO } from '../../interfaces/aluno-create-dto.interface.js';

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
  ],
  templateUrl: './aluno-index.component.html',
  styleUrl: './aluno-index.component.scss',
})
export class AlunoIndex implements OnInit {
  listaAlunos$!: Observable<AlunoModel[]>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly translate: TranslateService,
    private readonly alunoService: AlunoService,
  ) {}

  colunas: TabelaColuna[] = [
    { chave: 'id', titulo: 'Cód.' },
    { chave: 'matricula', titulo: 'Matrícula' },
    { chave: 'nome', titulo: 'Nome Completo' },
    { chave: 'cpf', titulo: 'CPF' },
    { chave: 'dataNascimento', titulo: 'Data de Nascimento' },
    { chave: 'email', titulo: 'E-mail' },
    { chave: 'sexoDescricao', titulo: 'Sexo' },
    { chave: 'ativo', titulo: 'Ativo' },
  ];

  opcoesSexo: SelectOptionInterface[] = [
    { value: 1, label: 'ALUNO.FORMULARIO.SEXO_MASCULINO' },
    { value: 2, label: 'ALUNO.FORMULARIO.SEXO_FEMININO' },
    { value: 3, label: 'ALUNO.FORMULARIO.SEXO_OUTRO' },
  ];

  alunoForm!: FormGroup<{
    nome: FormControl<string | null>;
    cpf: FormControl<string | null>;
    email: FormControl<string | null>;
    dataNascimento: FormControl<string | null>;
    sexo: FormControl<number | null>;
  }>;

  ngOnInit(): void {
    this.alunoForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      cpf: ['', [Validators.required, CpfCnpjValidator.validarCpfCnpj()]],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', [Validators.required, IdadeValidator.validarIdade()]],
      sexo: new FormControl<number | null>(null, Validators.required),
    });

    this.carregarAlunos();

    const valoresNumericosSexoEnum = Object.values(SexoEnum).filter(
      (valor) => typeof valor === 'number',
    ) as number[];

    this.opcoesSexo = valoresNumericosSexoEnum.map((valor) => ({
      value: valor,
      label: this.obterChaveTraducaoSexo(valor),
    }));
  }

  carregarAlunos(): void {
    this.listaAlunos$ = this.alunoService.buscarAlunos().pipe(
      map(
        (dadosRetornados) =>
          dadosRetornados.map((aluno) => ({
            ...aluno,
            sexoDescricao: this.obterDescricaoSexo(aluno.sexo),
          })) as AlunoModel[],
      ),
    );
  }

  private criarAlunoParaEnvio(): AlunoCreateDTO {
    const formValues = this.alunoForm.value;

    return {
      nome: formValues.nome!.trim(),
      cpf: formValues.cpf!.trim(),
      email: formValues.email!.trim(),
      dataNascimento: this.formatarDataParaApi(formValues.dataNascimento!),
      sexo: Number(formValues.sexo),
    };
  }

  mostrarAlerta: boolean = false;
  tipoAlerta: 'sucesso' | 'erro' = 'sucesso';
  textoAlerta: string = '';

  AdicionarAluno() {
    if (this.alunoForm.invalid) {
      this.tipoAlerta = 'erro';
      this.textoAlerta = 'MENSAGEM.FORMULARIO_INVALIDO';
      this.mostrarAlerta = true;
      return;
    }
    const novoAluno = this.criarAlunoParaEnvio();

    this.alunoService
      .adicionarAluno(novoAluno)
      .pipe(
        tap(() => {
          this.fecharModal();
          this.carregarAlunos();
        }),
        catchError(() => {
          this.tipoAlerta = 'erro';
          this.textoAlerta = 'MENSAGEM.ERRO_CADASTRO_ALUNO';
          this.mostrarAlerta = true;
          return of(null);
        }),
      )
      .subscribe();
  }

  private formatarDataParaApi(dataNascimento: string): string {
    const [ano, mes, dia] = dataNascimento.split('-');
    return `${ano.padStart(4, '0')}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  obterDescricaoSexo(valorEnum: number): string {
    switch (Number(valorEnum)) {
      case 1:
        return this.translate.instant('ALUNO.FORMULARIO.SEXO_MASCULINO');
      case 2:
        return this.translate.instant('ALUNO.FORMULARIO.SEXO_FEMININO');
      case 3:
        return this.translate.instant('ALUNO.FORMULARIO.SEXO_OUTRO');
      default:
        return '-';
    }
  }

  obterErroCpfCnpj(): string {
    const controle = this.alunoForm.get('cpf');

    if (controle?.invalid && controle?.touched) {
      if (controle.hasError('required')) {
        return this.translate.instant('VALIDACAO.OBRIGATORIO');
      }

      if (controle.hasError('documentoInvalido')) {
        return this.translate.instant('VALIDACAO.DOCUMENTO_INVALIDO');
      }

      if (controle.hasError('cpfInvalido')) {
        return this.translate.instant('VALIDACAO.CPF_INVALIDO');
      }

      if (controle.hasError('cnpjInvalido')) {
        return this.translate.instant('VALIDACAO.CNPJ_INVALIDO');
      }
    }

    return '';
  }

  obterErroDataNascimento(): string {
    const controle = this.alunoForm.get('dataNascimento');

    if (controle?.invalid && controle?.touched) {
      if (controle.hasError('required')) {
        return this.translate.instant('VALIDACAO.OBRIGATORIO');
      }

      if (controle.hasError('dataFuturaOuPresente')) {
        return this.translate.instant('VALIDACAO.DATA_FUTURA');
      }

      if (controle.hasError('idadeMaximaExcedida')) {
        return this.translate.instant('VALIDACAO.IDADE_MAXIMA');
      }
    }

    return '';
  }

  obterChaveTraducaoSexo(valorEnum: number): string {
    switch (valorEnum) {
      case SexoEnum.MASCULINO:
        return 'ALUNO.FORMULARIO.SEXO_MASCULINO';
      case SexoEnum.FEMININO:
        return 'ALUNO.FORMULARIO.SEXO_FEMININO';
      case SexoEnum.OUTRO:
        return 'ALUNO.FORMULARIO.SEXO_OUTRO';
      default:
        return '';
    }
  }

  isModalAberto: boolean = false;

  abrirModal() {
    this.isModalAberto = true;
  }

  fecharModal() {
    this.isModalAberto = false;
    this.mostrarAlerta = false;
    this.alunoForm.reset();
  }

  trocarIdioma(idioma: string) {
    this.translate.use(idioma);
  }
}
