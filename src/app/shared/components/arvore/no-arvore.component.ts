import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ChaveNo,
  EstadoMarcacao,
  EventoArvore,
  EventoMarcacao,
  NoArvore,
} from '../../interfaces/ui/no-arvore.interface';
import { folhasDe } from '../../utils/folhas-de.util';

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
  @Input() selecionados: ReadonlySet<ChaveNo> = new Set<ChaveNo>();
  @Input() marcados: ReadonlySet<ChaveNo> = new Set<ChaveNo>();

  @Output() marcou = new EventEmitter<EventoMarcacao<T>>();
  @Output() evento = new EventEmitter<EventoArvore<T>>();

  protected aberto(): boolean {
    return this.expandidos.has(this.no.chave);
  }

  protected alternar(mouse: MouseEvent): void {
    mouse.stopPropagation();
    this.evento.emit({ tipo: 'alternou', no: this.no });
  }

  protected selecionar(mouse: MouseEvent): void {
    this.evento.emit({
      tipo: 'selecionou',
      no: this.no,
      alternar: mouse.ctrlKey || mouse.metaKey,
    });
  }

  protected escolhido(): boolean {
    return this.selecionados.has(this.no.chave);
  }

  protected estadoMarcacao(): EstadoMarcacao {
    const folhas = folhasDe(this.no);

    if (folhas.length === 0) return 'vazio';

    const marcadas = folhas.filter((folha) => this.marcados.has(folha)).length;

    if (marcadas === 0) return 'desmarcado';

    return marcadas === folhas.length ? 'marcado' : 'parcial';
  }

  protected marcar(mouse: MouseEvent): void {
    mouse.stopPropagation();
    this.marcou.emit({ no: this.no, marcar: this.estadoMarcacao() !== 'marcado' });
  }
}
