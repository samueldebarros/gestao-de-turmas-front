import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TextoValidator } from '../../../shared/validators/texto.validator';
import { TurnoEnum } from '../../../shared/enums/turno.enum';
import { Router } from '@angular/router';
import { PassoStepper } from '../../../shared/interfaces/ui/passo-stepper.interface';
import { StepperComponent } from '../../../shared/components/stepper.component/stepper.component';
import { Botao } from '../../../shared/components/botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { agruparPorDisciplina } from '../../../shared/utils/agrupar-por-disciplina.util';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { PassoDisciplinasComponent } from '../../../shared/components/passos/passo-disciplinas.component/passo-disciplinas.component';
import { PassoAlunosComponent } from '../../../shared/components/passos/passo-alunos.component/passo-alunos.component';
import { PassoInformacoesComponent } from '../../../shared/components/passos/passo-informacoes.component/passo-informacoes.component';
import { AsyncPipe } from '@angular/common';
import { TurmaFacadeService } from '../../../core/facades/turma-facade.service';
import { AlertaState } from '../../../shared/interfaces/ui/alerta-state.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TurmaAdicionarDTO } from '../../../shared/interfaces/dto/turma-adicionar-dto.interface';
import { MensagemComponent } from '../../../shared/components/mensagem.component/mensagem.component';
import { LinhaImportacao, parsearCsvAlunos } from '../../../shared/utils/parsear-csv-alunos.util';
import { lerArquivoTexto } from '../../../shared/utils/ler-arquivo-texto.util';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ImportacaoResultado,
  LinhaErro,
} from '../../../shared/interfaces/dto/importacao-alunos.interface';

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
        validators: [Validators.required, TextoValidator.naoEmBranco()],
      }),
      serie: new FormControl<number | null>(null, Validators.required),
      anoLetivo: new FormControl<number | null>(null, Validators.required),
      capacidade: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      turno: new FormControl<TurnoEnum | null>(null, Validators.required),
    }),
    alocacoes: new FormControl<number[]>([], {
      nonNullable: true,
      validators: Validators.required,
    }),
    alunosIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  readonly planilha = new FormControl<File | null>(null);

  readonly errosImportacao = signal<LinhaErro[]>([]);

  readonly preview$ = this.planilha.valueChanges.pipe(
    tap(() => this.errosImportacao.set([])),
    switchMap((arquivo) =>
      arquivo
        ? lerArquivoTexto(arquivo).pipe(
            map((texto) => parsearCsvAlunos(texto)),
            catchError(() => of<LinhaImportacao[]>([])),
          )
        : of<LinhaImportacao[]>([]),
    ),
  );

  readonly linhas = toSignal(this.preview$, { initialValue: [] as LinhaImportacao[] });

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
    if (this.podeAvancar && this.passoAtual < this.passos.length - 1) this.passoAtual++;
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

  confirmarImportacao(): void {
    const enviaveis = this.linhas()
      .map((linha, indiceOriginal) => ({ linha, indiceOriginal }))
      .filter((x) => x.linha.valida);
    if (enviaveis.length === 0) return;

    this.alunoFacade
      .importarAlunos(enviaveis.map((x) => x.linha.dados))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: ImportacaoResultado) => {
          const ids = res.criados.map((c) => c.id);
          this.alunosIds.setValue([...new Set([...this.alunosIds.value, ...ids])]);
          this.errosImportacao.set([]);
          this.planilha.reset();
          this.alerta.set({ visivel: true, tipo: 'sucesso', texto: 'TURMA.IMPORTAR.SUCESSO' });
        }),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 422 && err.error?.erros) {
            this.errosImportacao.set(
              (err.error.erros as LinhaErro[]).map((e) => ({
                ...e,
                indice: enviaveis[e.indice].indiceOriginal,
              })),
            );
          } else {
            this.alerta.set({ visivel: true, tipo: 'erro', texto: 'TURMA.IMPORTAR.ERRO' });
          }
          return of(null);
        }),
      )
      .subscribe();
  }

  concluir(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
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
