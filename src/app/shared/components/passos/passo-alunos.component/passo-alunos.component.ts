import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ResultadoPaginado } from '../../../interfaces/ui/resultado-paginado.interface';
import { AlunoInterface } from '../../../interfaces/entities/aluno.interface';
import { PaginacaoComponent } from '../../paginacao.component/paginacao.component';
import { TranslatePipe } from '@ngx-translate/core';
import { FileUploadComponent } from '../../file-upload.component/file-upload.component';
import { LinhaImportacao } from '../../../utils/parsear-csv-alunos.util';
import { LinhaErro } from '../../../interfaces/dto/importacao-alunos.interface';

@Component({
  selector: 'app-passo-alunos',
  imports: [PaginacaoComponent, TranslatePipe, FileUploadComponent, ReactiveFormsModule],
  templateUrl: './passo-alunos.component.html',
  styleUrl: './passo-alunos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassoAlunosComponent {
  @Input({ required: true }) pagina!: ResultadoPaginado<AlunoInterface>;
  @Input({ required: true }) planilha!: FormControl<File | null>;
  @Input() linhasPreview: LinhaImportacao[] | null = null;
  @Input() errosImportacao: LinhaErro[] = [];
  @Input() selecionados: number[] = [];
  @Output() alternar = new EventEmitter<number>();
  @Output() mudarPagina = new EventEmitter<number>();
  @Output() confirmarImportacao = new EventEmitter<void>();

  estaSelecionado(id: number): boolean {
    return this.selecionados.includes(id);
  }

  erroDaLinha(indice: number): LinhaErro | undefined {
    return this.errosImportacao.find((e) => e.indice === indice);
  }
}
