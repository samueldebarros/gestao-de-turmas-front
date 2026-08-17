import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChaveNo, EventoArvore, NoArvore } from '../../interfaces/ui/no-arvore.interface';
import { NoArvoreComponent } from './no-arvore.component';

@Component({
  selector: 'app-arvore',
  templateUrl: './arvore.component.html',
  styleUrl: './arvore.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoArvoreComponent],
})
export class ArvoreComponent<T> {
  @Input() nos: readonly NoArvore<T>[] = [];
  @Input() expandidos: ReadonlySet<ChaveNo> = new Set<ChaveNo>();

  @Output() evento = new EventEmitter<EventoArvore<T>>();
}
