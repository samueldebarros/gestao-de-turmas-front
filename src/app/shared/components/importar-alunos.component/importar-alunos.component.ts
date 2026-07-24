import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { ImportacaoResultado, LinhaErro } from '../../interfaces/dto/importacao-alunos.interface';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { lerArquivoTexto } from '../../utils/ler-arquivo-texto.util';
import { LinhaImportacao, parsearCsvAlunos } from '../../utils/parsear-csv-alunos.util';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FileUploadComponent } from '../file-upload.component/file-upload.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-importar-alunos',
  imports: [FileUploadComponent, TranslatePipe, ReactiveFormsModule],
  templateUrl: './importar-alunos.component.html',
  styleUrl: './importar-alunos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportarAlunosComponent {
  @Input() accept = '.csv';
  @Input() tamanhoMaximoMb = 2;
  @Output() importado = new EventEmitter<ImportacaoResultado>();

  private readonly facade = inject(AlunoFacadeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly planilha = new FormControl<File | null>(null);
  protected readonly errosImportacao = signal<LinhaErro[]>([]);
  protected readonly erroGeral = signal(false);

  private readonly preview$ = this.planilha.valueChanges.pipe(
    tap(() => {
      this.errosImportacao.set([]);
      this.erroGeral.set(false);
    }),
    switchMap((arquivo) =>
      arquivo
        ? lerArquivoTexto(arquivo).pipe(
            map((texto) => parsearCsvAlunos(texto)),
            catchError(() => of<LinhaImportacao[]>([])),
          )
        : of<LinhaImportacao[]>([]),
    ),
  );

  protected readonly linhas = toSignal(this.preview$, { initialValue: [] as LinhaImportacao[] });

  protected erroDaLinha(indice: number): LinhaErro | undefined {
    return this.errosImportacao().find((e) => e.indice === indice);
  }

  protected confirmar(): void {
    const enviaveis = this.linhas()
      .map((linha, indiceOriginal) => ({ linha, indiceOriginal }))
      .filter((x) => x.linha.valida);
    if (enviaveis.length === 0) return;

    this.facade
      .importarAlunos(enviaveis.map((x) => x.linha.dados))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.errosImportacao.set([]);
          this.planilha.reset();
          this.importado.emit(res);
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
            this.erroGeral.set(true);
          }
          return of(null);
        }),
      )
      .subscribe();
  }
}
