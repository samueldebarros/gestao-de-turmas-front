import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TurmaInterface } from '../../interfaces/entities/turma.interface';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-turma-card',
  imports: [TranslatePipe],
  templateUrl: './turma-card.component.html',
  styleUrl: './turma-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaCardComponent {
  @Input({ required: true }) turma!: TurmaInterface;
  @Output() acaoCard = new EventEmitter<TurmaInterface>();

  protected aoTeclarEspaco(evento: Event): void {
    evento.preventDefault();
    this.acaoCard.emit(this.turma);
  }
}
