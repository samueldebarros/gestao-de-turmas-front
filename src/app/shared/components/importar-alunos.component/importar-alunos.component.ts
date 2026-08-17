import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ImportadorCsvComponent } from '../importador-csv.component/importador-csv.component';
import { AlunoFacadeService } from '../../../core/facades/aluno-facade.service';
import { parsearCsvAlunos } from '../../utils/parsear-csv-alunos.util';
import { AlunoAdicionarDTO } from '../../interfaces/dto/aluno-adicionar-dto.interface';
import { ImportacaoResultado } from '../../interfaces/dto/importacao-alunos.interface';

@Component({
  selector: 'app-importar-alunos',
  imports: [ImportadorCsvComponent, TranslatePipe],
  templateUrl: './importar-alunos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportarAlunosComponent {
  @Input() accept = '.csv';
  @Input() tamanhoMaximoMb = 2;
  @Output() importado = new EventEmitter<ImportacaoResultado>();

  private readonly facade = inject(AlunoFacadeService);

  protected readonly parse = parsearCsvAlunos;

  protected readonly rotuloLinha = (dados: AlunoAdicionarDTO): string =>
    `${dados.nome} — ${dados.email}`;

  protected readonly importar = (dtos: AlunoAdicionarDTO[]): Observable<ImportacaoResultado> =>
    this.facade.importarAlunos(dtos);
}
