import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { TurmaFacadeService } from '../../core/facades/turma-facade.service';
import { Botao } from '../../shared/components/botao/botao.component';
import { FiltroListaComponent } from '../../shared/components/filtro-lista.component/filtro-lista.component';
import { FormFieldSelectComponent } from '../../shared/components/form-field-select.component/form-field-select.component';
import { FormFieldTextComponent } from '../../shared/components/form-field-text.component/form-field-text.component';
import { MensagemComponent } from '../../shared/components/mensagem.component/mensagem.component';
import { Modal } from '../../shared/components/modal/modal.component';
import { PaginacaoComponent } from '../../shared/components/paginacao.component/paginacao.component';
import { TurmaCardComponent } from '../../shared/components/turma-card.component/turma-card.component';
import {
  validadoresAnoLetivoTurma,
  validadoresCapacidadeTurma,
  validadoresIdentificadorTurma,
} from '../../shared/constants/limites-turma.const';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { TurmaEditarDTO } from '../../shared/interfaces/dto/turma-editar-dto.interface';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { AlertaState } from '../../shared/interfaces/ui/alerta-state.interface';
import { EstadoModalTurma } from '../../shared/interfaces/ui/estado-modal-turma.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { SelectFilterInterface } from '../../shared/interfaces/ui/select-filter.interface';
import { SelectOptionInterface } from '../../shared/interfaces/ui/select-option.interface';
import { ErrorMessagePipe } from '../../shared/pipes/error-message.pipe';
import { ErrorParamsPipe } from '../../shared/pipes/error-params.pipe';
import { extrairMensagemDeRegra } from '../../shared/utils/mensagem-regra-negocio.util';

@Component({
  selector: 'app-turma-index',
  imports: [
    Botao,
    FiltroListaComponent,
    MensagemComponent,
    TurmaCardComponent,
    PaginacaoComponent,
    Modal,
    ReactiveFormsModule,
    FormFieldTextComponent,
    FormFieldSelectComponent,
    ErrorMessagePipe,
    ErrorParamsPipe,
    TranslatePipe,
    AsyncPipe,
    RouterLink,
  ],
  templateUrl: './turma-index.component.html',
  styleUrl: './turma-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaIndexComponent {
  private readonly facade = inject(TurmaFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly sucessoCadastro = signal<boolean>(history.state?.sucesso === true);

  readonly estado$ = this.facade.estado$;

  readonly alertaPagina = signal<AlertaState>({ visivel: false, tipo: 'erro', texto: '' });
  readonly alertaModal = signal<AlertaState>({ visivel: false, tipo: 'erro', texto: '' });

  private readonly estadoModal = signal<EstadoModalTurma>({ modo: 'fechado' });
  private readonly idsEmVoo = signal<ReadonlySet<number>>(new Set());

  readonly modalAberto = computed(() => this.estadoModal().modo !== 'fechado');
  readonly tituloModal = computed(() => 'TURMA.MODAL.EDICAO_TITULO');

  readonly opcoesTurno: SelectOptionInterface[] = [
    { value: TurnoEnum.MATUTINO, label: 'TURMA.TURNO.1' },
    { value: TurnoEnum.VESPERTINO, label: 'TURMA.TURNO.2' },
    { value: TurnoEnum.NOTURNO, label: 'TURMA.TURNO.3' },
  ];

  readonly opcoesSerie: SelectOptionInterface[] = [
    { value: 1, label: 'TURMA.SERIE.1' },
    { value: 2, label: 'TURMA.SERIE.2' },
    { value: 3, label: 'TURMA.SERIE.3' },
  ];

  readonly opcoesStatus: SelectOptionInterface[] = [
    { value: true, label: 'TURMA.CARD.ATIVO' },
    { value: false, label: 'TURMA.CARD.INATIVO' },
  ];

  readonly opcoesAnoLetivo: SelectOptionInterface[] = this.calcularOpcoesAnoLetivo();

  readonly filtrosTurma: SelectFilterInterface[] = [
    {
      controlName: 'anoLetivo',
      label: '',
      placeholder: 'TURMA.FILTRO.ANO_LETIVO',
      options: this.opcoesAnoLetivo,
    },
    {
      controlName: 'turno',
      label: '',
      placeholder: 'TURMA.FILTRO.TURNO',
      options: this.opcoesTurno,
    },
    {
      controlName: 'ativo',
      label: '',
      placeholder: 'TURMA.FILTRO.STATUS',
      options: this.opcoesStatus,
    },
  ];

  readonly turmaForm = this.fb.group({
    identificador: new FormControl<string>('', {
      nonNullable: true,
      validators: validadoresIdentificadorTurma,
    }),
    serie: new FormControl<number | null>(null, Validators.required),
    anoLetivo: new FormControl<number | null>(null, validadoresAnoLetivoTurma),
    turno: new FormControl<TurnoEnum | null>(null, Validators.required),
    capacidade: new FormControl<number | null>(null, validadoresCapacidadeTurma),
  });

  filtrar(filtro: FiltroListaInterface): void {
    this.facade.aplicarFiltros(filtro);
  }

  mudarPagina(pagina: number): void {
    this.facade.mudarPagina(pagina);
  }

  fecharSucesso(): void {
    this.sucessoCadastro.set(false);
  }

  abrirModalEdicao(turma: TurmaInterface): void {
    this.ocultarAlertaModal();
    this.turmaForm.reset({
      identificador: turma.identificador,
      serie: turma.serie,
      anoLetivo: turma.anoLetivo,
      turno: turma.turno,
      capacidade: turma.capacidade,
    });
    this.estadoModal.set({ modo: 'editar', turma });
  }

  fecharModal(): void {
    this.ocultarAlertaModal();
    this.estadoModal.set({ modo: 'fechado' });
  }

  estaEmVoo(id: number): boolean {
    return this.idsEmVoo().has(id);
  }

  alternarStatus(turma: TurmaInterface): void {
    if (this.idsEmVoo().has(turma.id)) return;

    this.marcarEmVoo(turma.id, true);
    const aoTerminar = finalize<unknown>(() => this.marcarEmVoo(turma.id, false));

    if (turma.ativo) {
      this.executarAcaoNaLista(
        this.facade.inativar(turma.id).pipe(aoTerminar),
        'MENSAGEM.SUCESSO_INATIVAR_TURMA',
        'MENSAGEM.ERRO_INATIVAR_TURMA',
      );
    } else {
      this.executarAcaoNaLista(
        this.facade.reativar(turma.id).pipe(aoTerminar),
        'MENSAGEM.SUCESSO_REATIVAR_TURMA',
        'MENSAGEM.ERRO_REATIVAR_TURMA',
      );
    }
  }

  salvarTurma(): void {
    this.ocultarAlertaModal();

    const estado = this.estadoModal();
    if (estado.modo !== 'editar') return;

    if (this.turmaForm.invalid) {
      this.turmaForm.markAllAsTouched();
      this.exibirAlertaModal('erro', 'MENSAGEM.FORMULARIO_INVALIDO');
      return;
    }

    const valores = this.turmaForm.getRawValue();
    const dto: TurmaEditarDTO = {
      id: estado.turma.id,
      identificador: valores.identificador.trim(),
      serie: valores.serie!,
      anoLetivo: valores.anoLetivo!,
      turno: valores.turno!,
      capacidade: valores.capacidade!,
    };

    this.executarAcaoNoModal(
      this.facade.editar(dto),
      'MENSAGEM.SUCESSO_EDICAO_TURMA',
      'MENSAGEM.ERRO_EDICAO_TURMA',
    );
  }

  ocultarAlertaPagina(): void {
    this.alertaPagina.update((alerta) => ({ ...alerta, visivel: false }));
  }

  ocultarAlertaModal(): void {
    this.alertaModal.update((alerta) => ({ ...alerta, visivel: false }));
  }

  private textoDoErro(erro: unknown, chaveErro: string): string {
    const status = (erro as { status?: number } | null)?.status;
    if (status !== 422) return chaveErro;

    return extrairMensagemDeRegra(erro) ?? 'MENSAGEM.ERRO_REGRA_NEGOCIO_TURMA';
  }

  private executarAcaoNaLista(
    acao$: Observable<unknown>,
    chaveSucesso: string,
    chaveErro: string,
  ): void {
    acao$
      .pipe(
        tap(() => this.exibirAlertaPagina('sucesso', chaveSucesso)),
        catchError((erro: unknown) => {
          this.exibirAlertaPagina('erro', this.textoDoErro(erro, chaveErro));
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

  private exibirAlertaModal(tipo: AlertaState['tipo'], texto: string): void {
    this.alertaModal.set({ visivel: true, tipo, texto });
  }

  private marcarEmVoo(id: number, emVoo: boolean): void {
    this.idsEmVoo.update((atual) => {
      const novo = new Set(atual);
      if (emVoo) {
        novo.add(id);
      } else {
        novo.delete(id);
      }
      return novo;
    });
  }

  private calcularOpcoesAnoLetivo(): SelectOptionInterface[] {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const ano = anoAtual - i;
      return { value: ano, label: String(ano) };
    });
  }
}
