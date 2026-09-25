import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmacaoAcao } from '../../interfaces/ui/confirmacao-acao.interface';
import { Botao } from '../botao/botao.component';
import { Modal } from '../modal/modal.component';

@Component({
  selector: 'app-confirmacao',
  imports: [TranslateModule, Modal, Botao],
  templateUrl: './confirmacao.component.html',
  styleUrl: './confirmacao.component.scss',
})
export class ConfirmacaoComponent {
  @Input() confirmacao: ConfirmacaoAcao | null = null;
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  confirmar(): void {
    this.confirmado.emit();
  }

  cancelar(): void {
    this.cancelado.emit();
  }
}
