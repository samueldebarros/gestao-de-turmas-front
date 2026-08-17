import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ChaveNo, EventoArvore, NoArvore } from '../../interfaces/ui/no-arvore.interface';

@Component({
  selector: 'app-no-arvore',
  templateUrl: './no-arvore.component.html',
  styleUrl: './no-arvore.component.scss',
  imports: [TranslatePipe, forwardRef(() => NoArvoreComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoArvoreComponent<T> {
  @Input({ required: true }) no!: NoArvore<T>;
  @Input() expandidos: ReadonlySet<ChaveNo> = new Set<ChaveNo>();

  @Output() evento = new EventEmitter<EventoArvore<T>>();

  protected aberto(): boolean {
    return this.expandidos.has(this.no.chave);
  }

  protected alternar(mouse: MouseEvent): void {
    mouse.stopPropagation();
    this.evento.emit({ tipo: 'alternou', no: this.no });
  }

  protected selecionar(): void {
    this.evento.emit({ tipo: 'selecionou', no: this.no });
  }
}
