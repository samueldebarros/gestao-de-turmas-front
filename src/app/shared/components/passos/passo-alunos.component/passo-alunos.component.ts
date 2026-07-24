import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ResultadoPaginado } from '../../../interfaces/ui/resultado-paginado.interface';
import { AlunoInterface } from '../../../interfaces/entities/aluno.interface';
import { PaginacaoComponent } from '../../paginacao.component/paginacao.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-passo-alunos',
  imports: [PaginacaoComponent, TranslatePipe],
  templateUrl: './passo-alunos.component.html',
  styleUrl: './passo-alunos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassoAlunosComponent {
  @Input({ required: true }) pagina!: ResultadoPaginado<AlunoInterface>;
  @Input() selecionados: number[] = [];
  @Output() alternar = new EventEmitter<number>();
  @Output() mudarPagina = new EventEmitter<number>();

  estaSelecionado(id: number): boolean {
    return this.selecionados.includes(id);
  }
}
