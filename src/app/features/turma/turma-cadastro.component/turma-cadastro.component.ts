import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TurnoEnum } from '../../../shared/enums/turno.enum';
import {
  validadoresAnoLetivoTurma,
  validadoresCapacidadeTurma,
  validadoresIdentificadorTurma,
} from '../../../shared/constants/limites-turma.const';
import { Router } from '@angular/router';
import { PassoStepper } from '../../../shared/interfaces/ui/passo-stepper.interface';
import { StepperComponent } from '../../../shared/components/stepper.component/stepper.component';
import { Botao } from '../../../shared/components/botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { agruparPorDisciplina } from '../../../shared/utils/agrupar-por-disciplina.util';
import { catchError, map, of, tap } from 'rxjs';
import { PassoDisciplinasComponent } from '../../../shared/components/passos/passo-disciplinas.component/passo-disciplinas.component';
import { PassoAlunosComponent } from '../../../shared/components/passos/passo-alunos.component/passo-alunos.component';
import { PassoInformacoesComponent } from '../../../shared/components/passos/passo-informacoes.component/passo-informacoes.component';
import { AsyncPipe } from '@angular/common';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { AlertaState } from '../../../shared/interfaces/ui/alerta-state.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TurmaAdicionarDTO } from '../../../shared/interfaces/dto/turma-adicionar-dto.interface';
import { MensagemComponent } from '../../../shared/components/mensagem.component/mensagem.component';
import { ImportacaoResultado } from '../../../shared/interfaces/dto/importacao-alunos.interface';
import { ImportarAlunosComponent } from '../../../shared/components/importar-alunos.component/importar-alunos.component';
import { FeatureFlagsService } from '../../../core/services/feature-flags.service';
import { DetalheAlerta } from '../../../shared/interfaces/ui/detalhe-alerta.interface';
import { causasDeInvalidez } from '../../../shared/utils/causas-de-invalidez.util';

const ROTULO_DO_CAMPO: Record<string, string> = {
  identificador: 'TURMA.FORMULARIO.IDENTIFICADOR_LABEL',
  serie: 'TURMA.FORMULARIO.SERIE_LABEL',
  anoLetivo: 'TURMA.FORMULARIO.ANO_LETIVO_LABEL',
  capacidade: 'TURMA.FORMULARIO.CAPACIDADE_LABEL',
  turno: 'TURMA.FORMULARIO.TURNO_LABEL',
};

@Component({
  selector: 'app-turma-cadastro',
  imports: [
    StepperComponent,
    Botao,
    TranslatePipe,
    PassoDisciplinasComponent,
    PassoAlunosComponent,
    PassoInformacoesComponent,
    AsyncPipe,
    MensagemComponent,
    ImportarAlunosComponent,
  ],
  templateUrl: './turma-cadastro.component.html',
  styleUrl: './turma-cadastro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AlunoFacadeService],
})
export class TurmaCadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly docenteFacade = inject(DocenteFacadeService);
  private readonly alunoFacade = inject(AlunoFacadeService);
  private readonly turmaFacade = inject(TurmaFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly featureFlags = inject(FeatureFlagsService);

  protected readonly importarCsvLigado = this.featureFlags.importarCsv;

  readonly alerta = signal<AlertaState>({ visivel: false, tipo: 'erro', texto: '' });

  passoAtual = 0;

  readonly passos: PassoStepper[] = [
    { id: 'informacoes', rotulo: 'TURMA.STEPPER.INFORMACOES' },
    { id: 'alocacoes', rotulo: 'TURMA.STEPPER.DISCIPLINAS' },
    { id: 'alunosIds', rotulo: 'TURMA.STEPPER.ALUNOS' },
  ];

  readonly cadastroForm = this.fb.group({
    informacoes: this.fb.group({
      identificador: new FormControl<string>('', {
        nonNullable: true,
        validators: validadoresIdentificadorTurma,
      }),
      serie: new FormControl<number | null>(null, Validators.required),
      anoLetivo: new FormControl<number | null>(null, validadoresAnoLetivoTurma),
      capacidade: new FormControl<number | null>(null, validadoresCapacidadeTurma),
      turno: new FormControl<TurnoEnum | null>(null, Validators.required),
    }),
    alocacoes: new FormControl<number[]>([], {
      nonNullable: true,
      validators: Validators.required,
    }),
    alunosIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  readonly disciplinas$ = this.docenteFacade.docentes$.pipe(map(agruparPorDisciplina));
  readonly alunosPagina$ = this.alunoFacade.resultado$;

  private readonly ordemGrupos = ['informacoes', 'alocacoes', 'alunosIds'] as const;

  get informacoesGroup(): FormGroup {
    return this.cadastroForm.controls.informacoes;
  }

  get alocacoes(): FormControl<number[]> {
    return this.cadastroForm.controls.alocacoes;
  }
  get alunosIds(): FormControl<number[]> {
    return this.cadastroForm.controls.alunosIds;
  }
  get podeAvancar(): boolean {
    return this.cadastroForm.get(this.ordemGrupos[this.passoAtual])!.valid;
  }

  avancar(): void {
    const grupoAtual = this.cadastroForm.get(this.ordemGrupos[this.passoAtual])!;
    if (grupoAtual.invalid) {
      grupoAtual.markAllAsTouched();
      this.exibirAlertaInvalido(
        grupoAtual instanceof FormGroup ? causasDeInvalidez(grupoAtual, ROTULO_DO_CAMPO) : [],
      );
      return;
    }
    if (this.passoAtual < this.passos.length - 1) this.passoAtual++;
  }

  voltar(): void {
    if (this.passoAtual > 0) this.passoAtual--;
  }

  setAlocacoes(ids: number[]): void {
    this.alocacoes.setValue(ids);
  }

  alternarAluno(id: number): void {
    const atuais = this.alunosIds.value;
    const proximos = atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id];
    this.alunosIds.setValue(proximos);
  }

  mudarPaginaAlunos(pagina: number): void {
    this.alunoFacade.mudarPagina(pagina);
  }

  preSelecionarImportados(res: ImportacaoResultado): void {
    const ids = res.criados.map((c) => c.id);
    this.alunosIds.setValue([...new Set([...this.alunosIds.value, ...ids])]);
    this.alerta.set({ visivel: true, tipo: 'sucesso', texto: 'IMPORTAR_ALUNOS.SUCESSO' });
  }

  concluir(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      this.exibirAlertaInvalido(causasDeInvalidez(this.informacoesGroup, ROTULO_DO_CAMPO));
      return;
    }
    this.turmaFacade
      .adicionar(this.montarDto())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.router.navigate(['/turmas'], { state: { sucesso: true } })),
        catchError(() => {
          this.alerta.set({ visivel: true, tipo: 'erro', texto: 'TURMA.MENSAGEM.ERRO_CADASTRO' });
          return of(null);
        }),
      )
      .subscribe();
  }

  fecharAlerta(): void {
    this.alerta.update((a) => ({ ...a, visivel: false }));
  }

  private exibirAlertaInvalido(detalhes: DetalheAlerta[]): void {
    this.alerta.set({
      visivel: true,
      tipo: 'erro',
      texto: 'MENSAGEM.CORRIJA_OS_CAMPOS',
      detalhes,
    });
  }

  private montarDto(): TurmaAdicionarDTO {
    const { informacoes, alocacoes, alunosIds } = this.cadastroForm.getRawValue();
    return {
      identificador: informacoes.identificador.trim(),
      serie: informacoes.serie!,
      anoLetivo: informacoes.anoLetivo!,
      turno: informacoes.turno!,
      capacidade: informacoes.capacidade!,
      alocacoes,
      alunosIds,
    };
  }

  cancelar(): void {
    this.router.navigate(['/turmas']);
  }
}
