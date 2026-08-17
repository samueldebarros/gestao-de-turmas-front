import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { FileUploadComponent } from '../file-upload.component/file-upload.component';
import { lerArquivoTexto } from '../../utils/ler-arquivo-texto.util';
import { LIMITE_LINHAS_IMPORTACAO } from '../../utils/parsear-csv-alunos.util';
import { LinhaImportacao } from '../../interfaces/ui/linha-importacao.interface';
import { ImportacaoResultado, LinhaErro } from '../../interfaces/dto/importacao-alunos.interface';

@Component({
  selector: 'app-importador-csv',
  imports: [FileUploadComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './importador-csv.component.html',
  styleUrl: './importador-csv.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportadorCsvComponent<T> {
  @Input({ required: true }) parse!: (texto: string) => LinhaImportacao<T>[];
  @Input({ required: true }) importar!: (dtos: T[]) => Observable<ImportacaoResultado>;
  @Input({ required: true }) rotuloLinha!: (dados: T) => string;
  @Input() label = '';
  @Input() accept = '.csv';
  @Input() tamanhoMaximoMb = 2;
  @Input() prefixoErroLinha = 'IMPORTADOR_CSV.ERRO_LINHA';
  @Input() limiteLinhas = LIMITE_LINHAS_IMPORTACAO;
  @Output() importado = new EventEmitter<ImportacaoResultado>();

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
            map((texto) => this.parse(texto)),
            catchError(() => of<LinhaImportacao<T>[]>([])),
          )
        : of<LinhaImportacao<T>[]>([]),
    ),
  );

  protected readonly linhas = toSignal(this.preview$, {
    initialValue: [] as LinhaImportacao<T>[],
  });

  protected readonly excedeuLimite = computed(() => this.linhas().length > this.limiteLinhas);

  protected erroDaLinha(indice: number): LinhaErro | undefined {
    return this.errosImportacao().find((e) => e.indice === indice);
  }

  protected confirmar(): void {
    if (this.excedeuLimite()) return;

    const enviaveis = this.linhas()
      .map((linha, indiceOriginal) => ({ linha, indiceOriginal }))
      .filter((x) => x.linha.valida);
    if (enviaveis.length === 0) return;

    this.importar(enviaveis.map((x) => x.linha.dados))
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
