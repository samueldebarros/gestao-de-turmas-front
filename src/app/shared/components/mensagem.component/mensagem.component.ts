import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-mensagem',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './mensagem.component.html',
  styleUrl: './mensagem.component.scss',
})
export class MensagemComponent {
  @Input() visivel: boolean = false;
  @Output() visivelChange = new EventEmitter<boolean>();

  @Input() tipo: 'sucesso' | 'erro' = 'sucesso';
  @Input() texto: string = '';

  fecharMensagem(): void {
    this.visivel = false;
    this.visivelChange.emit(this.visivel);
  }
}
